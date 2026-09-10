using Dharma.SharedKernel.Abstractions;

namespace Dharma.Unit.Tests;

public sealed class OutboxMessageTests
{
    [Fact]
    public void OutboxMessagePreservesEventIdentityAndIdempotencyKey()
    {
        var eventId = Guid.NewGuid();
        var occurredAt = DateTimeOffset.UtcNow;
        var message = new OutboxMessage(eventId, "FoundationEvent", "{}", occurredAt, "request-1");

        Assert.Equal(eventId, message.Id);
        Assert.Equal(occurredAt, message.OccurredAt);
        Assert.Equal("request-1", message.IdempotencyKey);
    }
}
