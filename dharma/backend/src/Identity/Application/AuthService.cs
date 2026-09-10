using System.Security.Cryptography;
using Dharma.Identity.Domain;

namespace Dharma.Identity.Application;

public sealed class AuthService(
    IIdentityStore store,
    IOtpProvider otpProvider,
    ITokenService tokenService,
    AuthPolicyOptions policy,
    TimeProvider clock) : IAuthService, IDisposable
{
    private readonly SemaphoreSlim gate = new(1, 1);

    public async Task<OtpRequestResult> RequestOtpAsync(OtpRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (!PhoneNumber.TryCreate(request.PhoneNumber, out var phone) || string.IsNullOrWhiteSpace(request.DeviceId))
            throw new AuthException("validation_error", 422, "The request is invalid.");

        var now = clock.GetUtcNow();
        await gate.WaitAsync(cancellationToken);
        try
        {
            var latest = await store.GetLatestChallengeAsync(phone!.Normalized, cancellationToken);
            if (latest is not null && latest.IsCurrent(now) && latest.ResendAvailableAt > now)
                throw new AuthException("rate_limited", 429, "Please wait before requesting another code.") { RetryAfter = latest.ResendAvailableAt - now };

            if (latest is not null && latest.IsCurrent(now)) latest.Supersede();
            var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString(System.Globalization.CultureInfo.InvariantCulture);
            var challenge = new OtpChallenge
            {
                Phone = phone,
                CodeHash = PasswordHash.Hash(otp),
                ExpiresAt = now.Add(policy.OtpLifetime),
                ResendAvailableAt = now.Add(policy.ResendCooldown)
            };
            await store.SaveChallengeAsync(challenge, cancellationToken);
            var delivery = await otpProvider.SendAsync(phone.Normalized, otp, cancellationToken);
            if (!delivery.Accepted)
            {
                challenge.Expire();
                throw new AuthException("otp_provider_unavailable", 503, "The verification service is temporarily unavailable.");
            }

            return new OtpRequestResult(challenge.Id, Mask(phone.Normalized), challenge.ExpiresAt, challenge.ResendAvailableAt);
        }
        finally { gate.Release(); }
    }

    public async Task<AuthSession> VerifyOtpAsync(VerifyOtpRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (!PhoneNumber.TryCreate(request.PhoneNumber, out var phone) || request.Otp.Length != 6 || request.Otp.Any(c => !char.IsDigit(c)))
            throw new AuthException("validation_error", 422, "The request is invalid.");

        var now = clock.GetUtcNow();
        await gate.WaitAsync(cancellationToken);
        try
        {
            var challenge = await store.GetChallengeAsync(request.ChallengeId, cancellationToken);
            if (challenge is null || challenge.Phone.Normalized != phone!.Normalized)
                throw new AuthException("otp_invalid", 401, "The verification code is invalid.");
            if (!challenge.IsCurrent(now))
            {
                if (challenge.State == OtpChallengeState.Superseded) throw new AuthException("otp_superseded", 409, "The verification code is no longer valid.");
                if (challenge.State == OtpChallengeState.Expired) throw new AuthException("otp_expired", 401, "The verification code has expired.");
                throw new AuthException("otp_attempts_exceeded", 429, "Too many verification attempts.");
            }
            if (!PasswordHash.Verify(request.Otp, challenge.CodeHash))
            {
                challenge.RegisterFailure(policy.MaxOtpAttempts);
                throw new AuthException(challenge.State == OtpChallengeState.Locked ? "otp_attempts_exceeded" : "otp_invalid", challenge.State == OtpChallengeState.Locked ? 429 : 401, "The verification code is invalid.");
            }

            challenge.Verify(now);
            var user = await store.GetUserByPhoneAsync(phone.Normalized, cancellationToken);
            var created = user is null;
            user ??= new User { Phone = phone, DisplayName = request.DisplayName };
            if (created) await store.SaveUserAsync(user, cancellationToken);
            var session = NewSession(user.Id, now);
            await store.SaveSessionAsync(session, cancellationToken);
            return CreateSession(user, session, now);
        }
        finally { gate.Release(); }
    }

    public async Task<AuthSession> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
    {
        var hash = tokenService.HashRefreshToken(request.RefreshToken);
        await gate.WaitAsync(cancellationToken);
        try
        {
            var node = await store.GetRefreshTokenAsync(hash, cancellationToken);
            if (node is null) throw new AuthException("refresh_invalid", 401, "The session is no longer valid.");
            var session = await store.GetSessionAsync(node.SessionId, cancellationToken);
            if (session is null || !session.IsActive(clock.GetUtcNow()))
                throw new AuthException("session_revoked", 401, "The session is no longer valid.");
            if (!node.IsUsable(clock.GetUtcNow()))
            {
                foreach (var familyNode in await store.GetFamilyTokensAsync(node.FamilyId, cancellationToken)) familyNode.Revoke(clock.GetUtcNow());
                session.Revoke(true);
                throw new AuthException("refresh_reuse_detected", 401, "The session is no longer valid.");
            }

            node.Consume(clock.GetUtcNow());
            session.Touch(clock.GetUtcNow());
            var user = await store.GetUserAsync(session.UserId, cancellationToken) ?? throw new AuthException("refresh_invalid", 401, "The session is no longer valid.");
            return CreateSession(user, session, clock.GetUtcNow());
        }
        finally { gate.Release(); }
    }

    public async Task LogoutAsync(Guid userId, LogoutRequest request, CancellationToken cancellationToken = default)
    {
        var sessions = request.AllSessions ? await store.GetSessionsAsync(userId, cancellationToken) : request.SessionId.HasValue ? [await store.GetSessionAsync(request.SessionId.Value, cancellationToken)] : [];
        foreach (var session in sessions.OfType<Session>()) if (session.UserId == userId) session.Revoke();
    }

    public async Task<CurrentUser> GetCurrentUserAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var user = await store.GetUserAsync(userId, cancellationToken);
        var session = await store.GetSessionAsync(sessionId, cancellationToken);
        if (user is null || session is null || session.UserId != userId || !session.IsActive(clock.GetUtcNow())) throw new AuthException("unauthenticated", 401, "Authentication is required.");
        return new CurrentUser(user.Id, user.DisplayName, "CUSTOMER", session.Id);
    }

    private Session NewSession(Guid userId, DateTimeOffset now) => new() { UserId = userId, ExpiresAt = now.Add(policy.RefreshTokenLifetime) };
    private AuthSession CreateSession(User user, Session session, DateTimeOffset now)
    {
        var refresh = tokenService.CreateRefreshToken();
        _ = store.SaveRefreshTokenAsync(new RefreshTokenNode { SessionId = session.Id, FamilyId = session.FamilyId, TokenHash = tokenService.HashRefreshToken(refresh), ExpiresAt = session.ExpiresAt }, CancellationToken.None);
        var access = tokenService.CreateAccessToken(user, session);
        return new AuthSession(new CurrentUser(user.Id, user.DisplayName, "CUSTOMER", session.Id), access.Token, access.ExpiresAt, refresh, session.ExpiresAt, session.Id);
    }
    private static string Mask(string phone) => phone.Length < 7 ? "***" : $"{phone[..3]}****{phone[^2..]}";
    public void Dispose() => gate.Dispose();
}

internal static class PasswordHash
{
    public static string Hash(string value)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(value, salt, 120_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }
    public static bool Verify(string value, string encoded)
    {
        var parts = encoded.Split('.');
        if (parts.Length != 2) return false;
        var salt = Convert.FromBase64String(parts[0]);
        var expected = Convert.FromBase64String(parts[1]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(value, salt, 120_000, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
