using Dharma.Identity.Application;
using StackExchange.Redis;

namespace Dharma.Identity.Infrastructure;

public sealed class RedisAuthRateLimiter(IConnectionMultiplexer connection) : IAuthRateLimiter
{
    public async Task<RateLimitDecision> CheckAsync(string key, int limit, TimeSpan window, CancellationToken cancellationToken = default)
    {
        var database = connection.GetDatabase();
        var redisKey = new RedisKey($"dharma:{key}");
        var count = await database.StringIncrementAsync(redisKey);
        if (count == 1)
            await database.KeyExpireAsync(redisKey, window);

        var ttl = await database.KeyTimeToLiveAsync(redisKey);
        return new RateLimitDecision(count <= limit, ttl.GetValueOrDefault(window));
    }
}

public sealed class NoOpAuthRateLimiter : IAuthRateLimiter
{
    public Task<RateLimitDecision> CheckAsync(string key, int limit, TimeSpan window, CancellationToken cancellationToken = default) =>
        Task.FromResult(new RateLimitDecision(true, TimeSpan.Zero));
}
