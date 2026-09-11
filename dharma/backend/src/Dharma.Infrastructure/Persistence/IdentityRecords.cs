using Dharma.Identity.Domain;

namespace Dharma.Infrastructure.Persistence;

public sealed class IdentityUserRecord
{
    public Guid Id { get; set; }
    public string PhoneNormalized { get; set; } = string.Empty;
    public string PhoneLookupHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public sealed class IdentityCustomerProfileRecord
{
    public Guid UserId { get; set; }
    public string? Preferences { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class IdentityOtpChallengeRecord
{
    public Guid Id { get; set; }
    public string PhoneNormalized { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public OtpChallengeState State { get; set; }
    public int AttemptCount { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset ResendAvailableAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class IdentitySessionRecord
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid FamilyId { get; set; }
    public SessionState State { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}

public sealed class IdentityRefreshTokenRecord
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid FamilyId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
}

public sealed class IdentityRoleRecord
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public sealed class IdentityUserRoleRecord
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
    public DateTimeOffset AssignedAt { get; set; }
}

public sealed class AuthAuditEventRecord
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public Guid? SessionId { get; set; }
    public Guid? ChallengeId { get; set; }
    public string Outcome { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; }
    public string? SafeMetadata { get; set; }
}
