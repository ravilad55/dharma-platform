using Dharma.Identity.Domain;

namespace Dharma.Identity.Application;

public sealed record AuthPolicyOptions
{
    public TimeSpan OtpLifetime { get; init; } = TimeSpan.FromMinutes(5);
    public TimeSpan ResendCooldown { get; init; } = TimeSpan.FromSeconds(30);
    public int MaxOtpAttempts { get; init; } = 5;
    public int MaxOtpRequestsPerWindow { get; init; } = 5;
    public TimeSpan OtpRequestWindow { get; init; } = TimeSpan.FromMinutes(15);
    public TimeSpan AccessTokenLifetime { get; init; } = TimeSpan.FromMinutes(10);
    public TimeSpan RefreshTokenLifetime { get; init; } = TimeSpan.FromDays(30);
    public string Issuer { get; init; } = "dharma-api";
    public string Audience { get; init; } = "dharma-customer";
}

public sealed record OtpRequest(string PhoneNumber, string DeviceId);
public sealed record OtpRequestResult(Guid ChallengeId, string MaskedPhone, DateTimeOffset ExpiresAtUtc, DateTimeOffset ResendAvailableAtUtc);
public sealed record VerifyOtpRequest(Guid ChallengeId, string PhoneNumber, string Otp, string DeviceId, string? DisplayName);
public sealed record RefreshRequest(string RefreshToken, string DeviceId);
public sealed record LogoutRequest(Guid? SessionId, bool AllSessions);
public sealed record CurrentUser(Guid Id, string? DisplayName, string Scope, Guid SessionId);
public sealed record AuthSession(CurrentUser User, string AccessToken, DateTimeOffset AccessTokenExpiresAtUtc, string RefreshToken, DateTimeOffset RefreshTokenExpiresAtUtc, Guid SessionId, string TokenType = "Bearer");

public interface IOtpProvider
{
    Task<OtpDeliveryResult> SendAsync(string normalizedPhone, string otp, CancellationToken cancellationToken = default);
}

public sealed record OtpDeliveryResult(bool Accepted, string? ProviderReference = null);

public interface IAuthService
{
    Task<OtpRequestResult> RequestOtpAsync(OtpRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<AuthSession> VerifyOtpAsync(VerifyOtpRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<AuthSession> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default);
    Task LogoutAsync(Guid userId, LogoutRequest request, CancellationToken cancellationToken = default);
    Task<CurrentUser> GetCurrentUserAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
}

public sealed class AuthException(string code, int statusCode, string message) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
    public TimeSpan? RetryAfter { get; init; }
}

public interface ITokenService
{
    (string Token, DateTimeOffset ExpiresAt) CreateAccessToken(User user, Session session);
    string CreateRefreshToken();
    string HashRefreshToken(string token);
}

public interface IIdentityStore
{
    Task<OtpChallenge?> GetChallengeAsync(Guid challengeId, CancellationToken cancellationToken);
    Task<OtpChallenge?> GetLatestChallengeAsync(string phone, CancellationToken cancellationToken);
    Task SaveChallengeAsync(OtpChallenge challenge, CancellationToken cancellationToken);
    Task<User?> GetUserByPhoneAsync(string phone, CancellationToken cancellationToken);
    Task<User?> GetUserAsync(Guid userId, CancellationToken cancellationToken);
    Task SaveUserAsync(User user, CancellationToken cancellationToken);
    Task SaveSessionAsync(Session session, CancellationToken cancellationToken);
    Task<Session?> GetSessionAsync(Guid sessionId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Session>> GetSessionsAsync(Guid userId, CancellationToken cancellationToken);
    Task SaveRefreshTokenAsync(RefreshTokenNode token, CancellationToken cancellationToken);
    Task<RefreshTokenNode?> GetRefreshTokenAsync(string hash, CancellationToken cancellationToken);
    Task<IReadOnlyList<RefreshTokenNode>> GetFamilyTokensAsync(Guid familyId, CancellationToken cancellationToken);
}
