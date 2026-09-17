using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Dharma.Order.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Integration.Tests;

public sealed class AddressTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task CustomerCanCreateUpdateAndDeleteOwnAddress()
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await Authenticate("+919876543301", "address-owner"));
        var created = await Create("Home", true);
        Assert.True(created.IsDefault);

        var update = await client.PutAsJsonAsync($"/api/v1/addresses/{created.Id}", Request("Temple", false));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var updated = await update.Content.ReadFromJsonAsync<AddressResponse>(JsonOptions);
        Assert.Equal("Temple", updated!.Label);
        Assert.False(updated.IsDefault);

        var delete = await client.DeleteAsync($"/api/v1/addresses/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        var addresses = await client.GetFromJsonAsync<IReadOnlyList<AddressResponse>>("/api/v1/addresses", JsonOptions);
        Assert.Empty(addresses!);
    }

    [Fact]
    public async Task FirstAddressIsDefaultAndNewDefaultReplacesPreviousOne()
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await Authenticate("+919876543302", "address-default"));
        var first = await Create("Home", false);
        var second = await Create("Work", true);
        var addresses = await client.GetFromJsonAsync<IReadOnlyList<AddressResponse>>("/api/v1/addresses", JsonOptions);

        Assert.True(first.IsDefault);
        Assert.True(second.IsDefault);
        Assert.Equal(second.Id, addresses!.Single(address => address.IsDefault).Id);
        Assert.Equal("Work", addresses![0].Label);
    }

    [Fact]
    public async Task CustomerCannotAccessAnotherCustomersAddress()
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await Authenticate("+919876543303", "address-one"));
        var address = await Create("Home", true);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await Authenticate("+919876543304", "address-two"));

        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/v1/addresses/{address.Id}", Request("Other", false))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/v1/addresses/{address.Id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<IReadOnlyList<AddressResponse>>("/api/v1/addresses", JsonOptions))!);
    }

    [Fact]
    public async Task InvalidAddressIsRejectedAndHistoricalOrderAddressIsUnaffected()
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await Authenticate("+919876543305", "address-history"));
        var invalid = await client.PostAsJsonAsync("/api/v1/addresses", Request("", false));
        Assert.Equal((HttpStatusCode)422, invalid.StatusCode);
        var address = await Create("Home", true);

        await factory.Services.SeedDevelopmentCatalogAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await db.Products.FirstAsync();
        var shop = await db.PoojaShops.SingleAsync(item => item.Id == product.PoojaShopId);
        var order = new OrderRecord { Id = Guid.NewGuid(), OrderNumber = $"DRM-{Guid.NewGuid():N}"[..32], CustomerId = shop.OwnerUserId, ShopId = shop.Id, Status = OrderStatus.Pending, Currency = "INR", CreatedAtUtc = DateTimeOffset.UtcNow, UpdatedAtUtc = DateTimeOffset.UtcNow };
        db.Orders.Add(order);
        db.OrderAddresses.Add(new OrderAddressRecord { Id = Guid.NewGuid(), OrderId = order.Id, ContactName = "Snapshot", ContactPhone = "+919876543210", AddressLine1 = "Historical Road", City = "Thane", State = "Maharashtra", PostalCode = "400601", Country = "IN" });
        await db.SaveChangesAsync();

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/v1/addresses/{address.Id}")).StatusCode);
        Assert.Equal("Historical Road", (await db.OrderAddresses.AsNoTracking().SingleAsync(item => item.OrderId == order.Id)).AddressLine1);
    }

    [Fact]
    public async Task UnauthenticatedAddressRequestIsRejected()
    {
        client.DefaultRequestHeaders.Authorization = null;
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/addresses")).StatusCode);
    }

    private async Task<AddressResponse> Create(string label, bool isDefault)
    {
        var response = await client.PostAsJsonAsync("/api/v1/addresses", Request(label, isDefault));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<AddressResponse>(JsonOptions))!;
    }

    private static object Request(string label, bool isDefault) => new { label, contactName = "Ravi Sharma", contactPhone = "+919876543210", addressLine1 = "1 Temple Road", addressLine2 = (string?)null, city = "Thane", state = "Maharashtra", postalCode = "400601", country = "IN", latitude = 19.2183m, longitude = 72.9781m, isDefault, customerId = Guid.NewGuid() };

    private async Task<string> Authenticate(string phone, string deviceId)
    {
        var request = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId });
        var challenge = await request.Content.ReadFromJsonAsync<OtpResponse>(JsonOptions);
        Assert.True(factory.TryGetOtp(phone, out var otp));
        var verify = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new { challengeId = challenge!.ChallengeId, phoneNumber = phone, otp, deviceId });
        return (await verify.Content.ReadFromJsonAsync<SessionResponse>(JsonOptions))!.AccessToken;
    }

    private sealed record OtpResponse(Guid ChallengeId);
    private sealed record SessionResponse(string AccessToken);
    private sealed record AddressResponse(Guid Id, string Label, bool IsDefault);
}
