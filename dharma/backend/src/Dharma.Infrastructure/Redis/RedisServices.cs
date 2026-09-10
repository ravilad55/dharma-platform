using System.Text.Json;
using Dharma.SharedKernel.Abstractions;
using StackExchange.Redis;

namespace Dharma.Infrastructure.Redis;

public sealed class RedisCache(IConnectionMultiplexer connection) : ICache
{
    private readonly IDatabase database = connection.GetDatabase();

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var value = await database.StringGetAsync(key);
        return value.IsNullOrEmpty ? default : JsonSerializer.Deserialize<T>(value.ToString());
    }

    public Task SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken cancellationToken = default) =>
        database.StringSetAsync(key, JsonSerializer.Serialize(value), expiry);

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) => database.KeyDeleteAsync(key);
}

public sealed class RedisDistributedLock(IConnectionMultiplexer connection) : IDistributedLock
{
    public async Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        var token = Guid.NewGuid().ToString("N");
        var acquired = await connection.GetDatabase().StringSetAsync(key, token, expiry, When.NotExists);
        return acquired ? new LockHandle(connection, key, token) : null;
    }

    private sealed class LockHandle(IConnectionMultiplexer connection, string key, string token) : IAsyncDisposable
    {
        public async ValueTask DisposeAsync()
        {
            const string script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
            await connection.GetDatabase().ScriptEvaluateAsync(script, [new RedisKey(key)], [new RedisValue(token)]);
        }
    }
}
