using System.Security.Cryptography;
using Dharma.Identity.Domain;
using Dharma.SharedKernel.Abstractions;

namespace Dharma.Identity.Application;

public sealed class AuthService(
    IIdentityStore store,
    IOtpProvider otpProvider,
    ITokenService tokenService,
    IAuditPublisher auditPublisher,
    AuthPolicyOptions policy,
    TimeProvider clock,
    IDistributedLock distributedLock,
    IAuthRateLimiter rateLimiter,
    ITransactionBoundary transactionBoundary) : IAuthService
{
    public async Task<OtpRequestResult> RequestOtpAsync(OtpRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (!PhoneNumber.TryCreate(request.PhoneNumber, out var phone) || string.IsNullOrWhiteSpace(request.DeviceId))
            throw new AuthException("validation_error", 422, "The request is invalid.");

        var requestLimit = await rateLimiter.CheckAsync($"otp:request:phone:{phone!.Normalized}", policy.MaxOtpRequestsPerWindow, policy.OtpRequestWindow, cancellationToken);
        var ipLimit = await rateLimiter.CheckAsync($"otp:request:ip:{ipAddress ?? "unknown"}", policy.MaxOtpRequestsPerWindow, policy.OtpRequestWindow, cancellationToken);
        if (!requestLimit.Allowed || !ipLimit.Allowed)
            throw new AuthException("rate_limited", 429, "Please wait before requesting another code.") { RetryAfter = requestLimit.RetryAfter > ipLimit.RetryAfter ? requestLimit.RetryAfter : ipLimit.RetryAfter };

        var now = clock.GetUtcNow();
        await using var challengeLock = await distributedLock.TryAcquireAsync($"auth:challenge:{phone!.Normalized}", TimeSpan.FromSeconds(5), cancellationToken)
            ?? throw new AuthException("rate_limited", 429, "Please wait before requesting another code.") { RetryAfter = policy.ResendCooldown };

        var latest = await store.GetLatestChallengeAsync(phone.Normalized, cancellationToken);
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

        await transactionBoundary.ExecuteAsync(async ct =>
        {
            if (latest is not null) await store.SaveChallengeAsync(latest, ct);
            await store.SaveChallengeAsync(challenge, ct);
            await auditPublisher.PublishAsync(new AuthAuditEvent
            {
                EventType = "OtpRequested",
                ChallengeId = challenge.Id,
                Outcome = "Accepted",
                CorrelationId = Guid.NewGuid().ToString(),
                SafeMetadata = Mask(phone.Normalized)
            }, ct);
        }, cancellationToken);

        var delivery = await otpProvider.SendAsync(phone.Normalized, otp, cancellationToken);
        if (!delivery.Accepted)
        {
            challenge.Expire();
            await store.SaveChallengeAsync(challenge, cancellationToken);
            throw new AuthException("otp_provider_unavailable", 503, "The verification service is temporarily unavailable.");
        }

        return new OtpRequestResult(challenge.Id, Mask(phone.Normalized), challenge.ExpiresAt, challenge.ResendAvailableAt);
    }

    public async Task<AuthSession> VerifyOtpAsync(VerifyOtpRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (!PhoneNumber.TryCreate(request.PhoneNumber, out var phone) || request.Otp.Length != 6 || request.Otp.Any(c => !char.IsDigit(c)))
            throw new AuthException("validation_error", 422, "The request is invalid.");

        var verificationLimit = await rateLimiter.CheckAsync($"otp:verify:{phone!.Normalized}:{ipAddress ?? "unknown"}", policy.MaxOtpVerificationsPerWindow, policy.OtpVerificationWindow, cancellationToken);
        if (!verificationLimit.Allowed)
            throw new AuthException("rate_limited", 429, "Too many verification attempts.") { RetryAfter = verificationLimit.RetryAfter };

        var now = clock.GetUtcNow();
        await using var verifyLock = await distributedLock.TryAcquireAsync($"auth:verify:{request.ChallengeId}", TimeSpan.FromSeconds(5), cancellationToken)
            ?? throw new AuthException("otp_superseded", 409, "The verification code is no longer valid.");

        AuthSession? result = null;
        await transactionBoundary.ExecuteAsync(async ct =>
        {
            var challenge = await store.GetChallengeAsync(request.ChallengeId, ct);
            if (challenge is null || challenge.Phone.Normalized != phone!.Normalized)
            {
                await auditPublisher.PublishAsync(new AuthAuditEvent
                {
                    EventType = "OtpVerificationFailed",
                    Outcome = "InvalidChallenge",
                    CorrelationId = Guid.NewGuid().ToString(),
                    SafeMetadata = Mask(phone.Normalized)
                }, ct);
                throw new AuthException("otp_invalid", 401, "The verification code is invalid.");
            }

            if (!challenge.IsCurrent(now))
            {
                var code = challenge.State == OtpChallengeState.Superseded ? "otp_superseded"
                    : challenge.State == OtpChallengeState.Expired ? "otp_expired"
                    : "otp_attempts_exceeded";
                var status = challenge.State == OtpChallengeState.Superseded ? 409 : challenge.State == OtpChallengeState.Locked ? 429 : 401;
                await auditPublisher.PublishAsync(new AuthAuditEvent
                {
                    EventType = "OtpVerificationFailed",
                    ChallengeId = challenge.Id,
                    Outcome = code,
                    CorrelationId = Guid.NewGuid().ToString(),
                    SafeMetadata = Mask(phone.Normalized)
                }, ct);
                throw new AuthException(code, status, code == "otp_attempts_exceeded" ? "Too many verification attempts." : "The verification code is invalid or expired.");
            }

            if (!PasswordHash.Verify(request.Otp, challenge.CodeHash))
            {
                challenge.RegisterFailure(policy.MaxOtpAttempts);
                await store.SaveChallengeAsync(challenge, ct);
                var locked = challenge.State == OtpChallengeState.Locked;
                await auditPublisher.PublishAsync(new AuthAuditEvent
                {
                    EventType = "OtpVerificationFailed",
                    ChallengeId = challenge.Id,
                    Outcome = locked ? "Locked" : "InvalidCode",
                    CorrelationId = Guid.NewGuid().ToString(),
                    SafeMetadata = Mask(phone.Normalized)
                }, ct);
                throw new AuthException(locked ? "otp_attempts_exceeded" : "otp_invalid", locked ? 429 : 401, locked ? "Too many verification attempts." : "The verification code is invalid.");
            }

            challenge.Verify(now);
            await store.SaveChallengeAsync(challenge, ct);

            var user = await store.GetUserByPhoneAsync(phone.Normalized, ct);
            var created = user is null;
            user ??= new User { Phone = phone, DisplayName = request.DisplayName };
            if (created) await store.SaveUserAsync(user, ct);

            if (created)
            {
                await store.SaveCustomerProfileAsync(new CustomerProfile { UserId = user.Id }, ct);
                await store.SaveRoleAsync(Role.Customer, ct);
                await store.SaveUserRoleAsync(new UserRole { UserId = user.Id, RoleId = Role.Customer.Id }, ct);
            }

            var session = NewSession(user.Id, now);
            await store.SaveSessionAsync(session, ct);
            result = await CreateSessionAsync(user, session, now, ct);

            await auditPublisher.PublishAsync(new AuthAuditEvent
            {
                EventType = created ? "UserRegistered" : "UserAuthenticated",
                UserId = user.Id,
                SessionId = session.Id,
                ChallengeId = challenge.Id,
                Outcome = "Success",
                CorrelationId = Guid.NewGuid().ToString(),
                SafeMetadata = Mask(phone.Normalized)
            }, ct);
        }, cancellationToken);

        return result!;
    }

    public async Task<AuthSession> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            throw new AuthException("validation_error", 422, "The request is invalid.");

        var hash = tokenService.HashRefreshToken(request.RefreshToken);
        await using var refreshLock = await distributedLock.TryAcquireAsync($"auth:refresh:{hash}", TimeSpan.FromSeconds(10), cancellationToken)
            ?? throw new AuthException("refresh_concurrent", 409, "The session refresh is already being processed.");

        AuthSession? result = null;
        await transactionBoundary.ExecuteAsync(async ct =>
        {
            var node = await store.GetRefreshTokenAsync(hash, ct);
            if (node is null) throw new AuthException("refresh_invalid", 401, "The session is no longer valid.");

            var session = await store.GetSessionAsync(node.SessionId, ct);
            if (session is null || !session.IsActive(clock.GetUtcNow()))
                throw new AuthException("session_revoked", 401, "The session is no longer valid.");

            if (!node.IsUsable(clock.GetUtcNow()))
            {
                foreach (var familyNode in await store.GetFamilyTokensAsync(node.FamilyId, ct)) familyNode.Revoke(clock.GetUtcNow());
                session.Revoke(true);
                await store.SaveSessionAsync(session, ct);
                await auditPublisher.PublishAsync(new AuthAuditEvent
                {
                    EventType = "RefreshReuseDetected",
                    UserId = session.UserId,
                    SessionId = session.Id,
                    Outcome = "SecurityRevoked",
                    CorrelationId = Guid.NewGuid().ToString()
                }, ct);
                throw new AuthException("refresh_reuse_detected", 401, "The session is no longer valid.");
            }

            node.Consume(clock.GetUtcNow());
            session.Touch(clock.GetUtcNow());
            await store.SaveRefreshTokenAsync(node, ct);
            await store.SaveSessionAsync(session, ct);

            var user = await store.GetUserAsync(session.UserId, ct) ?? throw new AuthException("refresh_invalid", 401, "The session is no longer valid.");
            result = await CreateSessionAsync(user, session, clock.GetUtcNow(), ct);

            await auditPublisher.PublishAsync(new AuthAuditEvent
            {
                EventType = "SessionRefreshed",
                UserId = user.Id,
                SessionId = result.SessionId,
                Outcome = "Success",
                CorrelationId = Guid.NewGuid().ToString()
            }, ct);
        }, cancellationToken);

        return result!;
    }

    public async Task LogoutAsync(Guid userId, LogoutRequest request, CancellationToken cancellationToken = default)
    {
        var all = request.AllSessions ? await store.GetSessionsAsync(userId, cancellationToken) : Array.Empty<Session>();
        var single = request.SessionId.HasValue ? await store.GetSessionAsync(request.SessionId.Value, cancellationToken) : null;
        var sessions = all.Concat(single is not null ? [single] : []).Where(s => s.UserId == userId).ToList();

        foreach (var session in sessions) session.Revoke();

        await transactionBoundary.ExecuteAsync(async ct =>
        {
            foreach (var session in sessions) await store.SaveSessionAsync(session, ct);
            await auditPublisher.PublishAsync(new AuthAuditEvent
            {
                EventType = "SessionRevoked",
                UserId = userId,
                Outcome = "Success",
                CorrelationId = Guid.NewGuid().ToString(),
                SafeMetadata = sessions.Count.ToString(System.Globalization.CultureInfo.InvariantCulture)
            }, ct);
        }, cancellationToken);
    }

    public async Task<CurrentUser> GetCurrentUserAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var user = await store.GetUserAsync(userId, cancellationToken);
        var session = await store.GetSessionAsync(sessionId, cancellationToken);
        if (user is null || session is null || session.UserId != userId || !session.IsActive(clock.GetUtcNow()))
            throw new AuthException("unauthenticated", 401, "Authentication is required.");
        return new CurrentUser(user.Id, user.DisplayName, "CUSTOMER", session.Id);
    }

    private Session NewSession(Guid userId, DateTimeOffset now) => new() { UserId = userId, ExpiresAt = now.Add(policy.RefreshTokenLifetime) };

    private async Task<AuthSession> CreateSessionAsync(User user, Session session, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var refresh = tokenService.CreateRefreshToken();
        await store.SaveRefreshTokenAsync(new RefreshTokenNode { SessionId = session.Id, FamilyId = session.FamilyId, TokenHash = tokenService.HashRefreshToken(refresh), ExpiresAt = session.ExpiresAt }, cancellationToken);
        var access = tokenService.CreateAccessToken(user, session);
        return new AuthSession(new CurrentUser(user.Id, user.DisplayName, "CUSTOMER", session.Id), access.Token, access.ExpiresAt, refresh, session.ExpiresAt, session.Id);
    }

    private static string Mask(string phone) => phone.Length < 7 ? "***" : $"{phone[..3]}****{phone[^2..]}";
}

public static class PasswordHash
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
