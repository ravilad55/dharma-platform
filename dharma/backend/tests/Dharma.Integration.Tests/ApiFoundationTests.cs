using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Dharma.Integration.Tests;

public sealed class ApiFoundationTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task LiveHealthCheckIsAvailable()
    {
        var response = await client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task VersionedApiBasePathIsAvailable()
    {
        var response = await client.GetAsync("/api/v1");
        var body = await response.Content.ReadFromJsonAsync<VersionResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("v1", body?.Version);
    }

    [Fact]
    public async Task CorrelationIdIsPreservedAndReturned()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/health/live");
        request.Headers.Add("X-Correlation-ID", "qa-correlation-id");

        var response = await client.SendAsync(request);

        Assert.Equal("qa-correlation-id", response.Headers.GetValues("X-Correlation-ID").Single());
    }

    [Fact]
    public async Task UnknownApiRouteReturnsProblemDetails()
    {
        var response = await client.GetAsync("/api/v1/unknown");
        var contentType = response.Content.Headers.ContentType?.MediaType;

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", contentType);
    }

    private sealed record VersionResponse(string Name, string Version);
}
