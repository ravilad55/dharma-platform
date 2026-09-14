using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Integration.Tests;

public sealed class OrderCreationTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task CustomerCreatesPendingOrderWithSnapshotsAndCartIsCleared()
    {
        var setup = await CreateCheckoutSetup("+919876543321", "order-create");
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/orders") { Content = JsonContent.Create(new { addressId = setup.AddressId }) };
        request.Headers.Add("Idempotency-Key", "create-order-1");
        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<OrderResponse>(JsonOptions);
        Assert.NotNull(order);
        Assert.Equal(1, order!.Status);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        Assert.Single(await db.Orders.Where(item => item.Id == order.Id).ToListAsync());
        Assert.Single(await db.OrderItems.Where(item => item.OrderId == order.Id).ToListAsync());
        Assert.Single(await db.OrderAddresses.Where(item => item.OrderId == order.Id).ToListAsync());
        Assert.Single(await db.OrderStatusHistory.Where(item => item.OrderId == order.Id).ToListAsync());
        Assert.Empty(await db.CartItems.Where(item => item.CartId == setup.CartId).ToListAsync());
    }

    [Fact]
    public async Task SameCustomerAndKeyReturnsOriginalOrderWithoutDuplicate()
    {
        var setup = await CreateCheckoutSetup("+919876543322", "order-replay");
        var first = await CreateOrder(setup.AddressId, "order-replay-1");
        var second = await CreateOrder(setup.AddressId, "order-replay-1");
        Assert.Equal(first.Id, second.Id);
        Assert.Equal(first.OrderNumber, second.OrderNumber);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        Assert.Single(await db.Orders.Where(item => item.Id == first.Id).ToListAsync());
        Assert.Single(await db.OrderIdempotencyRecords.Where(item => item.CustomerId == setup.CustomerId && item.Key == "order-replay-1").ToListAsync());
    }

    [Fact]
    public async Task OtherCustomersAddressAndStaleCartDoNotCreateOrderOrClearCart()
    {
        var setup = await CreateCheckoutSetup("+919876543323", "order-stale");
        var otherAddress = await CreateAddressForOtherCustomer();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", setup.AccessToken);
        var foreign = await CreateOrderResponse(otherAddress, "order-foreign-1");
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await db.Products.SingleAsync(item => item.Id == setup.ProductId);
        product.Price += 100m;
        await db.SaveChangesAsync();

        var stale = await CreateOrderResponse(setup.AddressId, "order-stale-1");
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.NotEmpty(await db.CartItems.Where(item => item.CartId == setup.CartId).ToListAsync());
        Assert.Empty(await db.Orders.Where(item => item.CustomerId == setup.CustomerId).ToListAsync());
    }

    [Fact]
    public async Task ConcurrentSameKeyCreatesExactlyOneOrder()
    {
        var setup = await CreateCheckoutSetup("+919876543325", "order-concurrent");
        var first = CreateOrderResponse(setup.AddressId, "order-concurrent-1");
        var second = CreateOrderResponse(setup.AddressId, "order-concurrent-1");
        await Task.WhenAll(first, second);

        Assert.Equal(1, new[] { first.Result, second.Result }.Count(response => response.StatusCode == HttpStatusCode.Created));
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        Assert.Single(await db.Orders.Where(item => item.CustomerId == setup.CustomerId).ToListAsync());
    }

    private async Task<(Guid CustomerId, Guid AddressId, Guid CartId, Guid ProductId, string AccessToken)> CreateCheckoutSetup(string phone, string deviceId)
    {
        var session = await Authenticate(phone, deviceId);
        var addressResponse = await client.PostAsJsonAsync("/api/v1/addresses", AddressRequest());
        var address = await addressResponse.Content.ReadFromJsonAsync<AddressResponse>(JsonOptions);
        await factory.Services.SeedDevelopmentCatalogAsync();
        var products = await client.GetFromJsonAsync<PagedProducts>("/api/v1/products?page=1&pageSize=1", JsonOptions);
        var productId = products!.Items[0].Id;
        var cartResponse = await client.PostAsJsonAsync("/api/v1/cart/items", new { productId, quantity = 2 });
        var cart = await cartResponse.Content.ReadFromJsonAsync<CartResponse>(JsonOptions);
        return (session.User.Id, address!.Id, cart!.Id, productId, session.AccessToken);
    }

    private async Task<Guid> CreateAddressForOtherCustomer()
    {
        await Authenticate("+919876543324", "order-other-address");
        var response = await client.PostAsJsonAsync("/api/v1/addresses", AddressRequest());
        var address = await response.Content.ReadFromJsonAsync<AddressResponse>(JsonOptions);
        return address!.Id;
    }

    private async Task<OrderResponse> CreateOrder(Guid addressId, string key)
    {
        var response = await CreateOrderResponse(addressId, key);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<OrderResponse>(JsonOptions))!;
    }

    private async Task<HttpResponseMessage> CreateOrderResponse(Guid addressId, string key)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/orders") { Content = JsonContent.Create(new { addressId }) };
        request.Headers.Add("Idempotency-Key", key);
        return await client.SendAsync(request);
    }

    private async Task<SessionResponse> Authenticate(string phone, string deviceId)
    {
        var request = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId });
        var challenge = await request.Content.ReadFromJsonAsync<OtpResponse>(JsonOptions);
        Assert.True(factory.TryGetOtp(phone, out var otp));
        var verify = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new { challengeId = challenge!.ChallengeId, phoneNumber = phone, otp, deviceId });
        var session = await verify.Content.ReadFromJsonAsync<SessionResponse>(JsonOptions);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session!.AccessToken);
        return session;
    }

    private static object AddressRequest() => new { label = "Home", contactName = "Ravi Sharma", contactPhone = "+919876543210", addressLine1 = "Flat 101", addressLine2 = (string?)null, city = "Thane", state = "Maharashtra", postalCode = "400601", country = "IN", latitude = 19.2183m, longitude = 72.9781m, isDefault = true };
    private sealed record OtpResponse(Guid ChallengeId);
    private sealed record CustomerResponse(Guid Id);
    private sealed record SessionResponse(CustomerResponse User, string AccessToken);
    private sealed record AddressResponse(Guid Id);
    private sealed record ProductResponse(Guid Id);
    private sealed record PagedProducts(IReadOnlyList<ProductResponse> Items);
    private sealed record CartResponse(Guid Id);
    private sealed record OrderResponse(Guid Id, string OrderNumber, int Status);
}
