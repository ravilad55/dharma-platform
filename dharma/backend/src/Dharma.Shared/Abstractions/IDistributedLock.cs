namespace Dharma.SharedKernel.Abstractions;

public interface IDistributedLock
{
    Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default);
}
