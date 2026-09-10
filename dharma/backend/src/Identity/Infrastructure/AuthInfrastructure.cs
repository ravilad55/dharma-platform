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

public sealed class JwtTokenService(IOptions<AuthPolicyOptions> options, IHostEnvironment environment) : ITokenService
{
    private readonly AuthPolicyOptions policy = options.Value;
    private readonly byte[] key = Encoding.UTF8.GetBytes(environment.IsProduction()
        ? throw new InvalidOperationException("JWT signing key configuration is required in production.")
        : "development-only-ephemeral-signing-key-change-me");

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
        services.Configure<AuthPolicyOptions>(configuration.GetSection("Authentication"));
        services.AddSingleton<IIdentityStore, InMemoryIdentityStore>();
        services.AddSingleton<IOtpProvider, DevelopmentOtpProvider>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<TimeProvider>(TimeProvider.System);
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
