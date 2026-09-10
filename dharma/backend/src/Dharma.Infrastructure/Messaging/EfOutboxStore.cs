using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Dharma.SharedKernel.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Messaging;

public sealed class EfOutboxStore(DharmaDbContext dbContext) : IOutboxStore
{
    public async Task EnqueueAsync(OutboxMessage message, CancellationToken cancellationToken = default)
    {
        dbContext.Outbox.Add(new OutboxRecord
        {
            Id = message.Id,
            EventType = message.EventType,
            Payload = message.Payload,
            OccurredAt = message.OccurredAt,
            IdempotencyKey = message.IdempotencyKey
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<OutboxMessage>> GetPendingAsync(int batchSize, CancellationToken cancellationToken = default)
    {
        var records = await dbContext.Outbox
            .Where(message => message.PublishedAt == null)
            .OrderBy(message => message.OccurredAt)
            .Take(batchSize)
            .ToListAsync(cancellationToken);
        return records.Select(message => new OutboxMessage(
            message.Id,
            message.EventType,
            message.Payload,
            message.OccurredAt,
            message.IdempotencyKey)).ToArray();
    }
}

public sealed class JsonEventPublisher(IOutboxStore outboxStore) : IEventPublisher
{
    public Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : class
    {
        var envelope = new OutboxMessage(
            Guid.NewGuid(),
            typeof(T).FullName ?? typeof(T).Name,
            JsonSerializer.Serialize(message),
            DateTimeOffset.UtcNow);
        return outboxStore.EnqueueAsync(envelope, cancellationToken);
    }
}
