namespace Dharma.SharedKernel.Abstractions;

public interface IOutboxStore
{
    Task EnqueueAsync(OutboxMessage message, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OutboxMessage>> GetPendingAsync(int batchSize, CancellationToken cancellationToken = default);
}
