namespace Dharma.SharedKernel.Abstractions;

public sealed record InboxMessage(Guid EventId, string Consumer, DateTimeOffset ProcessedAt);
