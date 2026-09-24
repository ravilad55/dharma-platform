using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Integration.Tests;

/// <summary>
/// DHARMA-BOOKING-01 Pandit discovery API. Exercises the customer-facing list/detail/services
/// endpoints against real MySQL via the shared web application factory. Discovery is read-only:
/// there is no booking creation in this slice.
/// </summary>
public sealed class PanditDiscoveryApiTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task ListReturnsOnlyActivePanditsAndExcludesInactiveOnes()
    {
        await Authenticate(client, "+919811100001", "pandit-list-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var hiddenId = await SeedInactivePanditAsync();

        var page = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?pageSize=100", JsonOptions);

        Assert.NotNull(page);
        Assert.True(page!.TotalCount >= 8, "expected the eight seeded active pandits");
        Assert.All(page.Items, item => Assert.NotEqual(hiddenId, item.Id));
        Assert.DoesNotContain(page.Items, item => item.DisplayName == "Pandit Hidden Test");
    }

    [Fact]
    public async Task ListPaginatesWithStableOrderingAndRejectsInvalidPaging()
    {
        await Authenticate(client, "+919811100002", "pandit-page-device");
        await factory.Services.SeedDevelopmentPanditsAsync();

        var firstPage = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?page=1&pageSize=3", JsonOptions);
        var secondPage = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?page=2&pageSize=3", JsonOptions);

        Assert.NotNull(firstPage);
        Assert.NotNull(secondPage);
        Assert.Equal(3, firstPage!.Items.Count);
        Assert.Equal(1, firstPage.Page);
        Assert.Equal(3, firstPage.PageSize);
        // Stable ordering: pages must not overlap.
        var firstIds = firstPage.Items.Select(item => item.Id).ToHashSet();
        Assert.DoesNotContain(secondPage!.Items, item => firstIds.Contains(item.Id));

        // Repeating the same request yields the same order (deterministic).
        var firstPageAgain = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?page=1&pageSize=3", JsonOptions);
        Assert.Equal(firstPage.Items.Select(item => item.Id), firstPageAgain!.Items.Select(item => item.Id));

        var pageZero = await client.GetAsync("/api/v1/pandits?page=0");
        Assert.Equal(HttpStatusCode.BadRequest, pageZero.StatusCode);
        Assert.Equal("application/problem+json", pageZero.Content.Headers.ContentType?.MediaType);

        var tooLarge = await client.GetAsync("/api/v1/pandits?pageSize=101");
        Assert.Equal(HttpStatusCode.BadRequest, tooLarge.StatusCode);
    }

    [Fact]
    public async Task SearchMatchesPanditNameAndServiceName()
    {
        await Authenticate(client, "+919811100003", "pandit-search-device");
        await factory.Services.SeedDevelopmentPanditsAsync();

        var byName = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?search=Krishna&pageSize=100", JsonOptions);
        Assert.NotNull(byName);
        Assert.Contains(byName!.Items, item => item.DisplayName.Contains("Krishna", StringComparison.OrdinalIgnoreCase));

        var byService = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?search=Rudrabhishek&pageSize=100", JsonOptions);
        Assert.NotNull(byService);
        Assert.NotEmpty(byService!.Items);
        // Every returned pandit must actually offer an active service matching the search term.
        foreach (var pandit in byService.Items)
        {
            var services = await client.GetFromJsonAsync<List<PanditServiceResponse>>($"/api/v1/pandits/{pandit.Id}/services", JsonOptions);
            Assert.Contains(services!, service => service.Name.Contains("Rudrabhishek", StringComparison.OrdinalIgnoreCase))
                ;
        }
    }

    [Fact]
    public async Task CityAndServiceFiltersNarrowResults()
    {
        await Authenticate(client, "+919811100004", "pandit-filter-device");
        await factory.Services.SeedDevelopmentPanditsAsync();

        var thane = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?city=Thane&pageSize=100", JsonOptions);
        Assert.NotNull(thane);
        Assert.NotEmpty(thane!.Items);
        Assert.All(thane.Items, item => Assert.Equal("Thane", item.City));

        var weddings = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?service=Wedding&pageSize=100", JsonOptions);
        Assert.NotNull(weddings);
        Assert.NotEmpty(weddings!.Items);
        foreach (var pandit in weddings.Items)
        {
            var services = await client.GetFromJsonAsync<List<PanditServiceResponse>>($"/api/v1/pandits/{pandit.Id}/services", JsonOptions);
            Assert.Contains(services!, service => service.Name.Contains("Wedding", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public async Task ServiceFilterIgnoresInactiveServices()
    {
        await Authenticate(client, "+919811100005", "pandit-inactive-service-device");
        await factory.Services.SeedDevelopmentPanditsAsync();

        // "Legacy Engagement Ritual" is seeded as an inactive service on Mahesh Joshi. It must never
        // surface a pandit through the service filter.
        var results = await client.GetFromJsonAsync<PanditListResponse>("/api/v1/pandits?service=Legacy Engagement Ritual&pageSize=100", JsonOptions);

        Assert.NotNull(results);
        Assert.Empty(results!.Items);
    }

    [Fact]
    public async Task DetailReturnsPanditWithActiveServicesOnly()
    {
        await Authenticate(client, "+919811100006", "pandit-detail-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var joshiId = Guid.Parse("11111111-0000-4000-a000-000000000004");

        var detail = await client.GetFromJsonAsync<PanditDetailResponse>($"/api/v1/pandits/{joshiId}", JsonOptions);

        Assert.NotNull(detail);
        Assert.Equal(joshiId, detail!.Id);
        Assert.Equal("Pandit Mahesh Joshi", detail.DisplayName);
        Assert.Equal("Pune", detail.City);
        Assert.Equal("Maharashtra", detail.State);
        Assert.NotEmpty(detail.Languages);
        Assert.NotEmpty(detail.Services);
        Assert.Contains(detail.Services, service => service.Name == "Wedding Puja");
        // The inactive "Legacy Engagement Ritual" must be excluded from the detail response.
        Assert.DoesNotContain(detail.Services, service => service.Name == "Legacy Engagement Ritual");
        Assert.All(detail.Services, service => Assert.Equal("INR", service.Currency));
    }

    [Fact]
    public async Task ServicesEndpointReturnsActiveServicesForPandit()
    {
        await Authenticate(client, "+919811100007", "pandit-services-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var iyerId = Guid.Parse("11111111-0000-4000-a000-000000000002");

        var services = await client.GetFromJsonAsync<List<PanditServiceResponse>>($"/api/v1/pandits/{iyerId}/services", JsonOptions);

        Assert.NotNull(services);
        Assert.NotEmpty(services!);
        Assert.Contains(services, service => service.Name == "Navgraha Puja");
        Assert.All(services, service =>
        {
            Assert.True(service.Price > 0);
            Assert.True(service.DurationMinutes > 0);
            Assert.Equal("INR", service.Currency);
        });
    }

    [Fact]
    public async Task UnknownOrInactivePanditReturnsNotFoundWithoutLeakingExistence()
    {
        await Authenticate(client, "+919811100008", "pandit-404-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var hiddenId = await SeedInactivePanditAsync();

        var unknown = await client.GetAsync($"/api/v1/pandits/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Equal("application/problem+json", unknown.Content.Headers.ContentType?.MediaType);

        // An inactive pandit is indistinguishable from one that does not exist.
        var hidden = await client.GetAsync($"/api/v1/pandits/{hiddenId}");
        Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);
        var hiddenServices = await client.GetAsync($"/api/v1/pandits/{hiddenId}/services");
        Assert.Equal(HttpStatusCode.NotFound, hiddenServices.StatusCode);
        Assert.DoesNotContain("Hidden", await hidden.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task DiscoveryEndpointsRequireCustomerTokenAndExposeNoInternalFields()
    {
        var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/v1/pandits")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/api/v1/pandits/{Guid.NewGuid()}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/api/v1/pandits/{Guid.NewGuid()}/services")).StatusCode);

        await Authenticate(client, "+919811100009", "pandit-security-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var listJson = await client.GetStringAsync("/api/v1/pandits?pageSize=100");
        var iyerId = Guid.Parse("11111111-0000-4000-a000-000000000002");
        var detailJson = await client.GetStringAsync($"/api/v1/pandits/{iyerId}");

        // Discovery-safe fields present.
        Assert.Contains("displayName", listJson);
        Assert.Contains("rating", listJson);
        Assert.Contains("services", detailJson);

        // Internal / non-discovery fields must never leak.
        foreach (var forbidden in new[] { "isActive", "createdAtUtc", "updatedAtUtc", "ownerUserId", "panditId", "tokenHash", "passwordHash", "correlationId" })
        {
            Assert.DoesNotContain(forbidden, listJson, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain(forbidden, detailJson, StringComparison.OrdinalIgnoreCase);
        }
    }

    private async Task<Guid> SeedInactivePanditAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var existing = await dbContext.Pandits.AsNoTracking().FirstOrDefaultAsync(pandit => pandit.DisplayName == "Pandit Hidden Test");
        if (existing is not null) return existing.Id;

        var now = DateTimeOffset.UtcNow;
        var hidden = new PanditRecord
        {
            Id = Guid.NewGuid(),
            DisplayName = "Pandit Hidden Test",
            ShortDescription = "Should never appear in discovery.",
            ExperienceYears = 5,
            City = "Nagpur",
            State = "Maharashtra",
            Languages = ["Hindi"],
            Rating = 4.0m,
            ReviewCount = 10,
            IsAvailable = true,
            IsActive = false,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
        dbContext.Pandits.Add(hidden);
        dbContext.PanditServices.Add(new PanditServiceRecord
        {
            Id = Guid.NewGuid(),
            PanditId = hidden.Id,
            Name = "Hidden Puja",
            Description = "Attached to an inactive pandit.",
            DurationMinutes = 60,
            Price = 500m,
            Currency = "INR",
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });
        await dbContext.SaveChangesAsync();
        return hidden.Id;
    }

    private async Task<SessionResponse> Authenticate(HttpClient target, string phone, string deviceId)
    {
        var request = await target.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId });
        var challenge = await request.Content.ReadFromJsonAsync<OtpResponse>(JsonOptions);
        Assert.True(factory.TryGetOtp(phone, out var otp));
        var verify = await target.PostAsJsonAsync("/api/v1/auth/verify-otp", new { challengeId = challenge!.ChallengeId, phoneNumber = phone, otp, deviceId });
        var session = await verify.Content.ReadFromJsonAsync<SessionResponse>(JsonOptions);
        target.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session!.AccessToken);
        return session;
    }

    private sealed record OtpResponse(Guid ChallengeId);
    private sealed record CustomerResponse(Guid Id);
    private sealed record SessionResponse(CustomerResponse User, string AccessToken);
    private sealed record PanditSummaryResponse(Guid Id, string DisplayName, string? ImageUrl, string? ShortDescription, int ExperienceYears, string City, string State, IReadOnlyList<string> Languages, decimal Rating, int ReviewCount, bool IsAvailable, string? PrimaryServiceName, decimal? StartingPrice, string Currency);
    private sealed record PanditListResponse(IReadOnlyList<PanditSummaryResponse> Items, int Page, int PageSize, int TotalCount);
    private sealed record PanditServiceResponse(Guid Id, string Name, string? Description, int DurationMinutes, decimal Price, string Currency);
    private sealed record PanditDetailResponse(Guid Id, string DisplayName, string? ImageUrl, string? Description, int ExperienceYears, string City, string State, IReadOnlyList<string> Languages, decimal Rating, int ReviewCount, bool IsAvailable, IReadOnlyList<PanditServiceResponse> Services);
}
