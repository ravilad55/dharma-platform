namespace Dharma.Identity.Domain;

public sealed record Role(Guid Id, string Code, string? Description = null)
{
    public static readonly Role Customer = new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "CUSTOMER", "Customer");
}

public sealed class UserRole
{
    public Guid UserId { get; init; }
    public Guid RoleId { get; init; }
    public DateTimeOffset AssignedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class CustomerProfile
{
    public Guid UserId { get; init; }
    public string? Preferences { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class AuthAuditEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string EventType { get; init; } = string.Empty;
    public Guid? UserId { get; init; }
    public Guid? SessionId { get; init; }
    public Guid? ChallengeId { get; init; }
    public string Outcome { get; init; } = string.Empty;
    public string? Reason { get; init; }
    public string CorrelationId { get; init; } = string.Empty;
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
    public string? SafeMetadata { get; init; }
}
