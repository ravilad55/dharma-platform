namespace Dharma.SharedKernel.Abstractions;

public sealed record OutboxMessage(
    Guid Id,
    string EventType,
    string Payload,
    DateTimeOffset OccurredAt,
    string? IdempotencyKey = null);
