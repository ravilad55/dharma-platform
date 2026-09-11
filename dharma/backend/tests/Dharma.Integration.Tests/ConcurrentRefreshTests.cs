using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Identity.Application;
using Dharma.Identity.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Dharma.Integration.Tests;

public sealed class CapturingOtpProvider : IOtpProvider
{
    private readonly ConcurrentDictionary<string, string> _otps = new();

    public Task<OtpDeliveryResult> SendAsync(string normalizedPhone, string otp, CancellationToken cancellationToken = default)
    {
        _otps[normalizedPhone] = otp;
        return Task.FromResult(new OtpDeliveryResult(true, "test-provider"));
    }

    public bool TryGetOtp(string normalizedPhone, out string? otp) => _otps.TryGetValue(normalizedPhone, out otp);
}

public sealed class RedisEnabledWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly CapturingOtpProvider _otpProvider = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Redis:ConnectionString", "localhost:6379");
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.AddSingleton<IOtpProvider>(_otpProvider);
            services.AddSingleton<IAuthRateLimiter, NoOpAuthRateLimiter>();
        });
        return base.CreateHost(builder);
    }

    public bool TryGetOtp(string normalizedPhone, out string? otp) => _otpProvider.TryGetOtp(normalizedPhone, out otp);
}

public sealed class ConcurrentRefreshTests(RedisEnabledWebApplicationFactory factory) : IClassFixture<RedisEnabledWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();
    private readonly RedisEnabledWebApplicationFactory webFactory = factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task SingleRefresh_ThenReuse_Works()
    {
        var phone = "+919876543220";
        var deviceId = "single-refresh-device";

        var requestResponse = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId = deviceId });
        Assert.Equal(HttpStatusCode.Accepted, requestResponse.StatusCode);
        var requestBody = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponse>(JsonOptions);
        Assert.NotNull(requestBody);

        Assert.True(webFactory.TryGetOtp(phone, out var otp));
        Assert.NotNull(otp);

        var verifyResponse = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new
        {
            challengeId = requestBody!.ChallengeId,
            phoneNumber = phone,
            otp = otp,
            deviceId = deviceId
        });
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);
        var verifyBody = await verifyResponse.Content.ReadFromJsonAsync<AuthSessionResponse>(JsonOptions);
        Assert.NotNull(verifyBody);
        var refreshToken = verifyBody!.RefreshToken;

        var refreshResponse1 = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = refreshToken, deviceId = deviceId });
        Assert.Equal(HttpStatusCode.OK, refreshResponse1.StatusCode);
        var refreshBody1 = await refreshResponse1.Content.ReadFromJsonAsync<AuthSessionResponse>(JsonOptions);
        Assert.NotNull(refreshBody1);
        var newRefreshToken = refreshBody1!.RefreshToken;
        Assert.False(string.IsNullOrEmpty(newRefreshToken));
        Assert.NotEqual(refreshToken, newRefreshToken);

        var refreshResponse2 = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = newRefreshToken, deviceId = deviceId });
        Assert.Equal(HttpStatusCode.OK, refreshResponse2.StatusCode);
    }

    [Fact]
    public async Task ConcurrentRefresh_WithSameToken_ExactlyOneSucceeds()
    {
        var phone = "+919876543210";
        var deviceId = "concurrent-device";

        var requestResponse = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId = deviceId });
        Assert.Equal(HttpStatusCode.Accepted, requestResponse.StatusCode);
        var requestBody = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponse>(JsonOptions);
        Assert.NotNull(requestBody);

        Assert.True(webFactory.TryGetOtp(phone, out var otp));
        Assert.NotNull(otp);

        var verifyResponse = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new
        {
            challengeId = requestBody!.ChallengeId,
            phoneNumber = phone,
            otp = otp,
            deviceId = deviceId
        });
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);
        var verifyBody = await verifyResponse.Content.ReadFromJsonAsync<AuthSessionResponse>(JsonOptions);
        Assert.NotNull(verifyBody);
        var refreshToken = verifyBody!.RefreshToken;

        var task1 = client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = refreshToken, deviceId = deviceId });
        var task2 = client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = refreshToken, deviceId = deviceId });

        await Task.WhenAll(task1, task2);

        var response1 = await task1;
        var response2 = await task2;

        var succeeded = new[] { response1, response2 }.Count(r => r.StatusCode == HttpStatusCode.OK);
        var failed = new[] { response1, response2 }.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(1, succeeded);
        Assert.Equal(1, failed);

        var failingResponse = succeeded == 1 ? (response1.StatusCode == HttpStatusCode.Conflict ? response1 : response2) : null;
        Assert.NotNull(failingResponse);
        var failingContent = await failingResponse.Content.ReadAsStringAsync();
        Assert.Contains("refresh_concurrent", failingContent);

        var successResponse = succeeded == 1 ? (response1.StatusCode == HttpStatusCode.OK ? response1 : response2) : null;
        Assert.NotNull(successResponse);
        var successBody = await successResponse.Content.ReadFromJsonAsync<AuthSessionResponse>(JsonOptions);
        Assert.NotNull(successBody);
        var newRefreshToken = successBody!.RefreshToken;
        Assert.False(string.IsNullOrEmpty(newRefreshToken));
        Assert.NotEqual(refreshToken, newRefreshToken);

        var reuseResponse = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = refreshToken, deviceId = deviceId });
        Assert.Equal(HttpStatusCode.Unauthorized, reuseResponse.StatusCode);

        var reuseWithNewResponse = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = newRefreshToken, deviceId = deviceId });
        if (reuseWithNewResponse.StatusCode != HttpStatusCode.OK)
        {
            var errorBody = await reuseWithNewResponse.Content.ReadAsStringAsync();
            Assert.Fail($"Expected OK but got {(int)reuseWithNewResponse.StatusCode}: {errorBody}");
        }
        Assert.Equal(HttpStatusCode.OK, reuseWithNewResponse.StatusCode);
    }

    [Fact]
    public async Task ConcurrentRefresh_Repeated_RunsSafely()
    {
        for (var iteration = 0; iteration < 3; iteration++)
        {
            var phone = $"+91987654321{iteration}";
            var deviceId = $"concurrent-device-{iteration}";

            var requestResponse = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId = deviceId });
            Assert.Equal(HttpStatusCode.Accepted, requestResponse.StatusCode);
            var requestBody = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponse>(JsonOptions);
            Assert.NotNull(requestBody);

            Assert.True(webFactory.TryGetOtp(phone, out var otp));
            Assert.NotNull(otp);

            var verifyResponse = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new
            {
                challengeId = requestBody!.ChallengeId,
                phoneNumber = phone,
                otp = otp,
                deviceId = deviceId
            });
            Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);
            var verifyBody = await verifyResponse.Content.ReadFromJsonAsync<AuthSessionResponse>(JsonOptions);
            Assert.NotNull(verifyBody);
            var refreshToken = verifyBody!.RefreshToken;

            var task1 = client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = refreshToken, deviceId = deviceId });
            var task2 = client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = refreshToken, deviceId = deviceId });

            await Task.WhenAll(task1, task2);

            var response1 = await task1;
            var response2 = await task2;

            var succeeded = new[] { response1, response2 }.Count(r => r.StatusCode == HttpStatusCode.OK);
            var failed = new[] { response1, response2 }.Count(r => r.StatusCode == HttpStatusCode.Conflict);

            Assert.Equal(1, succeeded);
            Assert.Equal(1, failed);
        }
    }

    private sealed record OtpRequestResponse(Guid ChallengeId, string MaskedPhone, DateTimeOffset ExpiresAtUtc, DateTimeOffset ResendAvailableAtUtc);
    private sealed record AuthSessionResponse(Guid SessionId, string AccessToken, DateTimeOffset AccessTokenExpiresAtUtc, string RefreshToken, DateTimeOffset RefreshTokenExpiresAtUtc, string TokenType);
}
