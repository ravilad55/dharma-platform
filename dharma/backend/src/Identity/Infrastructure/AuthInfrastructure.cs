using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Dharma.Identity.Application;
using Dharma.Identity.Domain;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Dharma.SharedKernel.Abstractions;

namespace Dharma.Identity.Infrastructure;

public sealed class DevelopmentOtpProvider(IHostEnvironment environment) : IOtpProvider
{
    public Task<OtpDeliveryResult> SendAsync(string normalizedPhone, string otp, CancellationToken cancellationToken = default)
    {
        if (!environment.IsDevelopment() && !environment.IsEnvironment("Test"))
            return Task.FromResult(new OtpDeliveryResult(false));
        return Task.FromResult(new OtpDeliveryResult(true, "development-provider"));
    }
}

public sealed class NoOpDistributedLock : IDistributedLock
{
    public Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default) =>
        Task.FromResult<IAsyncDisposable?>(new Lease());

    private sealed class Lease : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}

public sealed class NoOpAuditPublisher : IAuditPublisher
{
    public Task PublishAsync(AuthAuditEvent auditEvent, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

public sealed class NoOpTransactionBoundary : ITransactionBoundary
{
    public Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default) => action(cancellationToken);
}

public sealed class JwtTokenService : ITokenService
{
    private readonly AuthPolicyOptions policy;
    private readonly byte[] key;

    public JwtTokenService(IOptions<AuthPolicyOptions> options)
    {
        policy = options.Value;
        key = string.IsNullOrWhiteSpace(policy.SigningKey)
            ? throw new InvalidOperationException("JWT signing key configuration is required.")
            : Encoding.UTF8.GetBytes(policy.SigningKey);
    }

    public (string Token, DateTimeOffset ExpiresAt) CreateAccessToken(User user, Session session)
    {
        var expires = DateTimeOffset.UtcNow.Add(policy.AccessTokenLifetime);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim("sid", session.Id.ToString()),
                new Claim(ClaimTypes.Role, "CUSTOMER")
            ]),
            Issuer = policy.Issuer,
            Audience = policy.Audience,
            Expires = expires.UtcDateTime,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };
        var handler = new JwtSecurityTokenHandler();
        return (handler.WriteToken(handler.CreateToken(descriptor)), expires);
    }

    public string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    public string HashRefreshToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

public static class IdentityDependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.AddOptions<AuthPolicyOptions>()
            .Bind(configuration.GetSection("Authentication"))
            .ValidateOnStart();
        services.AddSingleton(sp => sp.GetRequiredService<IOptions<AuthPolicyOptions>>().Value);
        services.AddSingleton<IIdentityStore, InMemoryIdentityStore>();
        services.AddSingleton<IDistributedLock, NoOpDistributedLock>();
        services.AddSingleton<IAuthRateLimiter, NoOpAuthRateLimiter>();
        services.AddSingleton<IOtpProvider, DevelopmentOtpProvider>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IAuditPublisher, NoOpAuditPublisher>();
        services.AddSingleton<ITransactionBoundary, NoOpTransactionBoundary>();
        services.AddSingleton<TimeProvider>(TimeProvider.System);
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
