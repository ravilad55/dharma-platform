using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Integration.Tests;

/// <summary>
/// DHARMA-BOOKING-03 availability. Read-only slot viewing: the customer sees slots for a pandit's
/// active service on a given local date (Asia/Kolkata). No booking/hold/payment is exercised.
/// </summary>
public sealed class PanditAvailabilityApiTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly HttpClient client = factory.CreateClient();

    private static readonly Guid PanditId = Guid.Parse("11111111-0000-4000-a000-000000000001"); // Ramesh Sharma (active)
    private static readonly Guid InactivePanditId = Guid.Parse("11111111-0000-4000-a000-0000000000aa");
    private static readonly string[] ValidStatuses = ["Available", "Held", "Booked", "Blocked"];
    private static readonly string[] ForbiddenFields = ["panditId", "serviceId", "startAtUtc", "endAtUtc", "createdAtUtc", "updatedAtUtc"];

    [Fact]
    public async Task ReturnsSlotsForActiveServiceOnRequestedDateWithTimezoneAndMixedStatuses()
    {
        await Authenticate(client, "+919822200001", "avail-ok-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var (serviceId, date) = await SeedSlotsAsync(PanditId);

        var availability = await client.GetFromJsonAsync<AvailabilityResponse>(
            $"/api/v1/pandits/{PanditId}/availability?date={date}&serviceId={serviceId}", JsonOptions);

        Assert.NotNull(availability);
        Assert.Equal(date, availability!.Date);
        Assert.Equal("Asia/Kolkata", availability.Timezone);
        Assert.NotEmpty(availability.Slots);
        // Every slot exposes id/startAt/endAt/status and ends after it starts.
        Assert.All(availability.Slots, slot =>
        {
            Assert.NotEqual(Guid.Empty, slot.Id);
            Assert.False(string.IsNullOrWhiteSpace(slot.StartAt));
            Assert.False(string.IsNullOrWhiteSpace(slot.EndAt));
            Assert.Contains(slot.Status, ValidStatuses);
            Assert.True(DateTimeOffset.Parse(slot.EndAt, System.Globalization.CultureInfo.InvariantCulture) > DateTimeOffset.Parse(slot.StartAt, System.Globalization.CultureInfo.InvariantCulture));
        });
        // The seeded day includes both an Available and a non-Available slot.
        Assert.Contains(availability.Slots, slot => slot.Status == "Available");
        Assert.Contains(availability.Slots, slot => slot.Status != "Available");
        // Display times carry the +05:30 IST offset.
        Assert.Contains(availability.Slots, slot => slot.StartAt.Contains("+05:30"));
    }

    [Fact]
    public async Task OnlyReturnsSlotsForTheRequestedDate()
    {
        await Authenticate(client, "+919822200002", "avail-date-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var (serviceId, date) = await SeedSlotsAsync(PanditId);

        var sameDay = await client.GetFromJsonAsync<AvailabilityResponse>(
            $"/api/v1/pandits/{PanditId}/availability?date={date}&serviceId={serviceId}", JsonOptions);
        Assert.NotEmpty(sameDay!.Slots);
        Assert.All(sameDay.Slots, slot => Assert.StartsWith(date, slot.StartAt));

        // A far-future date with no seeded slots returns an empty list (still 200 with timezone).
        var emptyDay = await client.GetFromJsonAsync<AvailabilityResponse>(
            $"/api/v1/pandits/{PanditId}/availability?date=2099-01-01&serviceId={serviceId}", JsonOptions);
        Assert.NotNull(emptyDay);
        Assert.Empty(emptyDay!.Slots);
        Assert.Equal("Asia/Kolkata", emptyDay.Timezone);
    }

    [Fact]
    public async Task InvalidDateOrMissingServiceReturnsBadRequest()
    {
        await Authenticate(client, "+919822200003", "avail-400-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var (serviceId, _) = await SeedSlotsAsync(PanditId);

        var badDate = await client.GetAsync($"/api/v1/pandits/{PanditId}/availability?date=05-10-2026&serviceId={serviceId}");
        Assert.Equal(HttpStatusCode.BadRequest, badDate.StatusCode);
        Assert.Equal("application/problem+json", badDate.Content.Headers.ContentType?.MediaType);

        var missingService = await client.GetAsync($"/api/v1/pandits/{PanditId}/availability?date=2026-10-05");
        Assert.Equal(HttpStatusCode.BadRequest, missingService.StatusCode);
    }

    [Fact]
    public async Task UnknownPanditOrServiceReturnsNotFoundWithoutLeaking()
    {
        await Authenticate(client, "+919822200004", "avail-404-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var (serviceId, date) = await SeedSlotsAsync(PanditId);

        // Unknown pandit.
        var unknownPandit = await client.GetAsync($"/api/v1/pandits/{Guid.NewGuid()}/availability?date={date}&serviceId={serviceId}");
        Assert.Equal(HttpStatusCode.NotFound, unknownPandit.StatusCode);

        // Inactive pandit is indistinguishable from missing.
        await SeedInactivePanditWithServiceAsync();
        var inactive = await client.GetAsync($"/api/v1/pandits/{InactivePanditId}/availability?date={date}&serviceId={serviceId}");
        Assert.Equal(HttpStatusCode.NotFound, inactive.StatusCode);

        // Service that does not belong to this pandit.
        var foreignService = await client.GetAsync($"/api/v1/pandits/{PanditId}/availability?date={date}&serviceId={Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, foreignService.StatusCode);
    }

    [Fact]
    public async Task AvailabilityRequiresCustomerTokenAndExposesNoInternalFields()
    {
        var anonymous = factory.CreateClient();
        var unauth = await anonymous.GetAsync($"/api/v1/pandits/{PanditId}/availability?date=2026-10-05&serviceId={Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Unauthorized, unauth.StatusCode);

        await Authenticate(client, "+919822200005", "avail-sec-device");
        await factory.Services.SeedDevelopmentPanditsAsync();
        var (serviceId, date) = await SeedSlotsAsync(PanditId);
        var json = await client.GetStringAsync($"/api/v1/pandits/{PanditId}/availability?date={date}&serviceId={serviceId}");

        Assert.Contains("slots", json);
        Assert.Contains("timezone", json);
        Assert.Contains("startAt", json);
        // Internal / storage fields must not leak.
        foreach (var forbidden in ForbiddenFields)
        {
            Assert.DoesNotContain(forbidden, json, StringComparison.OrdinalIgnoreCase);
        }
    }

    /// <summary>
    /// Seeds a known set of slots for an active service of the given pandit on a fixed future local
    /// date, with one Available and one Booked slot, so assertions are deterministic. Returns the
    /// service id and the local date string.
    /// </summary>
    private async Task<(Guid ServiceId, string Date)> SeedSlotsAsync(Guid panditId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var serviceId = await dbContext.PanditServices.AsNoTracking()
            .Where(service => service.PanditId == panditId && service.IsActive)
            .Select(service => service.Id)
            .FirstAsync();

        // Fixed future local date in IST.
        const string date = "2030-06-15";
        var ist = TimeSpan.FromMinutes(330);
        if (!await dbContext.BookingSlots.AnyAsync(slot => slot.ServiceId == serviceId && slot.StartAtUtc >= new DateTimeOffset(2030, 6, 14, 0, 0, 0, TimeSpan.Zero) && slot.StartAtUtc < new DateTimeOffset(2030, 6, 16, 0, 0, 0, TimeSpan.Zero)))
        {
            var slotA = new DateTimeOffset(2030, 6, 15, 9, 0, 0, ist);
            var slotB = new DateTimeOffset(2030, 6, 15, 11, 0, 0, ist);
            dbContext.BookingSlots.AddRange(
                new BookingSlotRecord { Id = Guid.NewGuid(), PanditId = panditId, ServiceId = serviceId, StartAtUtc = slotA.ToUniversalTime(), EndAtUtc = slotA.AddMinutes(60).ToUniversalTime(), Status = 1, CreatedAtUtc = DateTimeOffset.UtcNow, UpdatedAtUtc = DateTimeOffset.UtcNow },
                new BookingSlotRecord { Id = Guid.NewGuid(), PanditId = panditId, ServiceId = serviceId, StartAtUtc = slotB.ToUniversalTime(), EndAtUtc = slotB.AddMinutes(60).ToUniversalTime(), Status = 3, CreatedAtUtc = DateTimeOffset.UtcNow, UpdatedAtUtc = DateTimeOffset.UtcNow });
            await dbContext.SaveChangesAsync();
        }

        return (serviceId, date);
    }

    private async Task SeedInactivePanditWithServiceAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        if (await dbContext.Pandits.AnyAsync(pandit => pandit.Id == InactivePanditId)) return;

        var now = DateTimeOffset.UtcNow;
        dbContext.Pandits.Add(new PanditRecord
        {
            Id = InactivePanditId,
            DisplayName = "Inactive Availability Pandit",
            City = "Nagpur",
            State = "Maharashtra",
            Languages = ["Hindi"],
            Rating = 4.0m,
            ReviewCount = 1,
            IsAvailable = true,
            IsActive = false,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });
        await dbContext.SaveChangesAsync();
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
    private sealed record AvailabilitySlotResponse(Guid Id, string StartAt, string EndAt, string Status);
    private sealed record AvailabilityResponse(string Date, string Timezone, IReadOnlyList<AvailabilitySlotResponse> Slots);
}
