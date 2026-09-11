using Dharma.Identity.Application;
using Dharma.Identity.Domain;
using Dharma.Identity.Infrastructure;
using Dharma.SharedKernel.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.FileProviders;

namespace Dharma.Unit.Tests;

public sealed class PhoneNumberTests
{
    [Theory]
    [InlineData("+919876543210", true)]
    [InlineData("+123456789012", true)]
    [InlineData("+1234567", true)]
    [InlineData("+12345678901234567890", false)]
    [InlineData("919876543210", false)]
    [InlineData("  +919876543210  ", true)]
    public void TryCreate_ValidatesNormalizedPhone(string input, bool expected)
    {
        var result = PhoneNumber.TryCreate(input, out var phone);
        Assert.Equal(expected, result);
        if (expected) Assert.NotNull(phone);
    }
}

public sealed class OtpChallengeTests
{
    [Fact]
    public void IsCurrent_ReturnsTrue_WhenSentAndNotExpired()
    {
        var challenge = new OtpChallenge { Phone = new PhoneNumber("+919876543210"), CodeHash = "hash", ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(1) };
        Assert.True(challenge.IsCurrent(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsCurrent_ReturnsFalse_WhenExpired()
    {
        var challenge = new OtpChallenge { Phone = new PhoneNumber("+919876543210"), CodeHash = "hash", ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1) };
        Assert.False(challenge.IsCurrent(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void RegisterFailure_LocksAtMaxAttempts()
    {
        var challenge = new OtpChallenge { Phone = new PhoneNumber("+919876543210"), CodeHash = "hash" };
        for (var i = 0; i < 5; i++) challenge.RegisterFailure(5);
        Assert.Equal(OtpChallengeState.Locked, challenge.State);
    }

    [Fact]
    public void Supersede_ChangesState()
    {
        var challenge = new OtpChallenge { Phone = new PhoneNumber("+919876543210"), CodeHash = "hash" };
        challenge.Supersede();
        Assert.Equal(OtpChallengeState.Superseded, challenge.State);
    }
}

public sealed class SessionTests
{
    [Fact]
    public void IsActive_ReturnsTrue_WhenActiveAndNotExpired()
    {
        var session = new Session { UserId = Guid.NewGuid(), FamilyId = Guid.NewGuid(), ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) };
        Assert.True(session.IsActive(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Revoke_ChangesStateToRevoked()
    {
        var session = new Session { UserId = Guid.NewGuid(), FamilyId = Guid.NewGuid() };
        session.Revoke();
        Assert.Equal(SessionState.Revoked, session.State);
    }

    [Fact]
    public void SecurityRevoke_ChangesStateToSecurityRevoked()
    {
        var session = new Session { UserId = Guid.NewGuid(), FamilyId = Guid.NewGuid() };
        session.Revoke(true);
        Assert.Equal(SessionState.SecurityRevoked, session.State);
    }
}

public sealed class RefreshTokenNodeTests
{
    [Fact]
    public void IsUsable_ReturnsFalse_WhenConsumed()
    {
        var node = new RefreshTokenNode { SessionId = Guid.NewGuid(), FamilyId = Guid.NewGuid(), TokenHash = "hash", ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) };
        node.Consume(DateTimeOffset.UtcNow);
        Assert.False(node.IsUsable(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsUsable_ReturnsFalse_WhenRevoked()
    {
        var node = new RefreshTokenNode { SessionId = Guid.NewGuid(), FamilyId = Guid.NewGuid(), TokenHash = "hash", ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) };
        node.Revoke(DateTimeOffset.UtcNow);
        Assert.False(node.IsUsable(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsUsable_ReturnsFalse_WhenExpired()
    {
        var node = new RefreshTokenNode { SessionId = Guid.NewGuid(), FamilyId = Guid.NewGuid(), TokenHash = "hash", ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1) };
        Assert.False(node.IsUsable(DateTimeOffset.UtcNow));
    }
}

public sealed class PasswordHashTests
{
    [Fact]
    public void HashAndVerify_ReturnsTrue_ForMatchingValue()
    {
        var hash = PasswordHash.Hash("123456");
        Assert.True(PasswordHash.Verify("123456", hash));
    }

    [Fact]
    public void Verify_ReturnsFalse_ForWrongValue()
    {
        var hash = PasswordHash.Hash("123456");
        Assert.False(PasswordHash.Verify("000000", hash));
    }
}

public sealed class AuthServiceTests
{
    [Fact]
    public async Task RequestOtp_ThrowsValidationError_ForInvalidPhone()
    {
        var store = new InMemoryIdentityStore();
        var provider = new DevelopmentOtpProvider(new DevelopmentEnvironment());
        var options = Options.Create(new AuthPolicyOptions { SigningKey = "test-key-test-key-test-key-t!" });
        var tokens = new JwtTokenService(options);
        var limiter = new NoOpAuthRateLimiter();
        var clock = new FakeTimeProvider();
        var policy = options.Value;
        var service = new AuthService(store, provider, tokens, new NoOpAuditPublisher(), policy, clock, new NoOpDistributedLock(), limiter, new NoOpTransactionBoundary());

        await Assert.ThrowsAsync<AuthException>(() => service.RequestOtpAsync(new OtpRequest("invalid", "device"), null));
    }

    [Fact]
    public async Task VerifyOtp_ThrowsInvalid_ForWrongCode()
    {
        var store = new InMemoryIdentityStore();
        var provider = new DevelopmentOtpProvider(new DevelopmentEnvironment());
        var options = Options.Create(new AuthPolicyOptions { SigningKey = "test-key-test-key-test-key-t!" });
        var tokens = new JwtTokenService(options);
        var limiter = new NoOpAuthRateLimiter();
        var clock = new FakeTimeProvider();
        var policy = options.Value;
        var service = new AuthService(store, provider, tokens, new NoOpAuditPublisher(), policy, clock, new NoOpDistributedLock(), limiter, new NoOpTransactionBoundary());

        var request = new OtpRequest("+919876543210", "device");
        var result = await service.RequestOtpAsync(request, null);
        await Assert.ThrowsAsync<AuthException>(() => service.VerifyOtpAsync(new VerifyOtpRequest(result.ChallengeId, "+919876543210", "000000", "device", null), null));
    }
}

public sealed class FakeTimeProvider : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
}

public sealed class NoOpTransactionBoundary : ITransactionBoundary
{
    public Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
    {
        return action(cancellationToken);
    }
}

public sealed class DevelopmentEnvironment : Microsoft.Extensions.Hosting.IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "tests";
    public string ContentRootPath { get; set; } = string.Empty;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}
