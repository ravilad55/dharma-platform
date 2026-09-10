namespace Dharma.Identity.Domain;

public enum OtpChallengeState
{
    Requested,
    Sent,
    Verified,
    Expired,
    Failed,
    Locked,
    Superseded
}

public enum SessionState
{
    Active,
    Revoked,
    Expired,
    SecurityRevoked
}

public sealed record PhoneNumber(string Normalized)
{
    public static bool TryCreate(string? value, out PhoneNumber? phone)
    {
        var normalized = value?.Trim().Replace(" ", string.Empty).Replace("-", string.Empty);
        if (normalized is null || normalized.Length is < 8 or > 16 || !normalized.StartsWith('+') || normalized.Skip(1).Any(c => !char.IsDigit(c)))
        {
            phone = null;
            return false;
        }

        phone = new PhoneNumber(normalized);
        return true;
    }
}

public sealed class User
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required PhoneNumber Phone { get; init; }
    public string? DisplayName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class OtpChallenge
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required PhoneNumber Phone { get; init; }
    public required string CodeHash { get; init; }
    public OtpChallengeState State { get; private set; } = OtpChallengeState.Sent;
    public int AttemptCount { get; private set; }
    public DateTimeOffset ExpiresAt { get; init; }
    public DateTimeOffset ResendAvailableAt { get; init; }
    public DateTimeOffset? ConsumedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public bool IsCurrent(DateTimeOffset now) => State == OtpChallengeState.Sent && ExpiresAt > now;
    public void Supersede() => State = OtpChallengeState.Superseded;
    public bool RegisterFailure(int maxAttempts)
    {
        AttemptCount++;
        if (AttemptCount >= maxAttempts) State = OtpChallengeState.Locked;
        return State == OtpChallengeState.Locked;
    }
    public void Expire() => State = OtpChallengeState.Expired;
    public void Verify(DateTimeOffset now) { State = OtpChallengeState.Verified; ConsumedAt = now; }
}

public sealed class Session
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public Guid FamilyId { get; init; } = Guid.NewGuid();
    public SessionState State { get; private set; } = SessionState.Active;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastSeenAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; init; }
    public void Touch(DateTimeOffset now) => LastSeenAt = now;
    public void Revoke(bool security = false) => State = security ? SessionState.SecurityRevoked : SessionState.Revoked;
    public void Expire() => State = SessionState.Expired;
    public bool IsActive(DateTimeOffset now) => State == SessionState.Active && ExpiresAt > now;
}

public sealed class RefreshTokenNode
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid SessionId { get; init; }
    public required Guid FamilyId { get; init; }
    public required string TokenHash { get; init; }
    public DateTimeOffset ExpiresAt { get; init; }
    public DateTimeOffset? ConsumedAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public bool IsConsumed => ConsumedAt.HasValue;
    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsUsable(DateTimeOffset now) => !IsConsumed && !IsRevoked && ExpiresAt > now;
    public void Consume(DateTimeOffset now) => ConsumedAt = now;
    public void Revoke(DateTimeOffset now) => RevokedAt = now;
}
