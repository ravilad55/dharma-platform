using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Dharma.Integration.Tests;

public sealed class AuthApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task RequestOtp_ReturnsAccepted_ForValidPhone()
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = "+919876543210", deviceId = "test-device" });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<OtpRequestResponse>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.ChallengeId);
        Assert.False(string.IsNullOrEmpty(body.MaskedPhone));
    }

    [Fact]
    public async Task RequestOtp_ReturnsValidationError_ForInvalidPhone()
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = "invalid", deviceId = "test-device" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task VerifyOtp_ReturnsUnauthorized_ForInvalidCode()
    {
        var requestResponse = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = "+919876543210", deviceId = "test-device" });
        var requestBody = await requestResponse.Content.ReadFromJsonAsync<OtpRequestResponse>();

        var response = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new
        {
            challengeId = requestBody!.ChallengeId,
            phoneNumber = "+919876543210",
            otp = "000000",
            deviceId = "test-device"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Refresh_ReturnsUnauthorized_ForInvalidToken()
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = "invalid", deviceId = "test-device" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_ReturnsUnauthorized_WithoutToken()
    {
        var response = await client.GetAsync("/api/v1/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private sealed record OtpRequestResponse(Guid ChallengeId, string MaskedPhone, DateTimeOffset ExpiresAtUtc, DateTimeOffset ResendAvailableAtUtc);
}
