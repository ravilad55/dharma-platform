using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Dharma.Order.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Integration.Tests;

public sealed class OrderHistoryApiTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task CustomerHistoryReturnsOwnOrdersNewestFirstWithPagination()
    {
        var session = await Authenticate(client, "+919876550101", "history-order-device");
        await factory.Services.SeedDevelopmentCatalogAsync();
        var seeded = new List<(Guid Id, string Number)>();
        for (var index = 1; index <= 5; index++) seeded.Add(await SeedOrderAsync(session.User.Id, DateTimeOffset.UtcNow.AddMinutes(-index)));
        var newestFirst = seeded.Select(item => item.Number).ToArray();

        var firstPage = await client.GetFromJsonAsync<OrderHistoryResponse>("/api/v1/orders?page=1&pageSize=2", JsonOptions);

        Assert.NotNull(firstPage);
        Assert.Equal(5, firstPage!.TotalCount);
        Assert.Equal(1, firstPage.Page);
        Assert.Equal(2, firstPage.PageSize);
        Assert.Equal([newestFirst[0], newestFirst[1]], firstPage.Items.Select(item => item.OrderNumber).ToArray());
        Assert.Equal(1, firstPage.Items[0].Status);
        Assert.Equal(500m, firstPage.Items[0].Subtotal);
        Assert.Equal(0m, firstPage.Items[0].DeliveryCharge);
        Assert.Equal(0m, firstPage.Items[0].ServiceCharge);
        Assert.Equal(500m, firstPage.Items[0].Total);
        Assert.Equal("INR", firstPage.Items[0].Currency);

        var lastPage = await client.GetFromJsonAsync<OrderHistoryResponse>("/api/v1/orders?page=3&pageSize=2", JsonOptions);
        Assert.NotNull(lastPage);
        Assert.Equal(newestFirst[4], Assert.Single(lastPage!.Items).OrderNumber);

        var emptyPage = await client.GetFromJsonAsync<OrderHistoryResponse>("/api/v1/orders?page=4&pageSize=2", JsonOptions);
        Assert.Empty(emptyPage!.Items);

        var invalidPage = await client.GetAsync("/api/v1/orders?page=0");
        Assert.Equal(HttpStatusCode.BadRequest, invalidPage.StatusCode);
        Assert.Equal("application/problem+json", invalidPage.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task CustomerOrderDetailReturnsSnapshotsThatSurviveCatalogAndAddressChanges()
    {
        var checkout = await CreateOrderThroughCheckout(client, "+919876550102", "history-detail-device", 2);

        var details = await client.GetFromJsonAsync<OrderDetailsResponse>($"/api/v1/orders/{checkout.OrderId}", JsonOptions);

        Assert.NotNull(details);
        Assert.Equal(checkout.OrderNumber, details!.OrderNumber);
        Assert.Equal(1, details.Status);
        Assert.Equal(checkout.Subtotal, details.Subtotal);
        Assert.Equal(0m, details.DeliveryCharge);
        Assert.Equal(0m, details.ServiceCharge);
        Assert.Equal(checkout.Subtotal, details.Total);
        Assert.Equal("INR", details.Currency);
        Assert.True(details.UpdatedAtUtc >= details.CreatedAtUtc);
        var item = Assert.Single(details.Items);
        Assert.Equal(checkout.ProductId, item.ProductId);
        Assert.Equal(checkout.ProductName, item.ProductName);
        Assert.Equal(checkout.ProductSku, item.Sku);
        Assert.Equal(2, item.Quantity);
        Assert.Equal(checkout.UnitPrice, item.UnitPrice);
        Assert.Equal(checkout.UnitPrice * 2, item.LineTotal);
        Assert.Equal(0m, item.TaxAmount);
        Assert.Equal(0m, item.DiscountAmount);
        Assert.Equal("INR", item.Currency);
        Assert.Equal("Ravi Sharma", details.Address.ContactName);
        Assert.Equal("+919876543210", details.Address.ContactPhone);
        Assert.Equal("Flat 101", details.Address.AddressLine1);
        Assert.Null(details.Address.AddressLine2);
        Assert.Equal("Thane", details.Address.City);
        Assert.Equal("Maharashtra", details.Address.State);
        Assert.Equal("400601", details.Address.PostalCode);
        Assert.Equal("IN", details.Address.Country);
        Assert.Equal(19.2183m, details.Address.Latitude);
        Assert.Equal(72.9781m, details.Address.Longitude);

        await MutateProductAsync(checkout.ProductId);
        var addressUpdate = await client.PutAsJsonAsync($"/api/v1/addresses/{checkout.AddressId}", AddressRequest(contactName: "Updated Ravi", addressLine1: "Flat 502", city: "Mumbai"));
        Assert.Equal(HttpStatusCode.OK, addressUpdate.StatusCode);
        await client.DeleteAsync($"/api/v1/addresses/{checkout.AddressId}");

        var afterMutation = await client.GetFromJsonAsync<OrderDetailsResponse>($"/api/v1/orders/{checkout.OrderId}", JsonOptions);

        Assert.NotNull(afterMutation);
        var snapshotItem = Assert.Single(afterMutation!.Items);
        Assert.Equal(checkout.ProductName, snapshotItem.ProductName);
        Assert.Equal(checkout.ProductSku, snapshotItem.Sku);
        Assert.Equal(checkout.UnitPrice, snapshotItem.UnitPrice);
        Assert.Equal(checkout.UnitPrice * 2, snapshotItem.LineTotal);
        Assert.Equal(checkout.Subtotal, afterMutation.Subtotal);
        Assert.Equal(checkout.Subtotal, afterMutation.Total);
        Assert.Equal("Ravi Sharma", afterMutation.Address.ContactName);
        Assert.Equal("Flat 101", afterMutation.Address.AddressLine1);
        Assert.Equal("400601", afterMutation.Address.PostalCode);

        var historyAfterMutation = await client.GetFromJsonAsync<OrderHistoryResponse>("/api/v1/orders?page=1&pageSize=1", JsonOptions);
        Assert.NotNull(historyAfterMutation);
        Assert.Equal(checkout.OrderId, historyAfterMutation!.Items[0].Id);
        Assert.Equal(checkout.Subtotal, historyAfterMutation.Items[0].Subtotal);
        Assert.Equal(checkout.Subtotal, historyAfterMutation.Items[0].Total);
    }

    [Fact]
    public async Task CustomerCannotReadAnotherCustomersOrderAndUnknownOrderIsNotFound()
    {
        var ownerClient = factory.CreateClient();
        var checkout = await CreateOrderThroughCheckout(ownerClient, "+919876550103", "history-owner-device", 1);
        var strangerClient = factory.CreateClient();
        await Authenticate(strangerClient, "+919876550104", "history-stranger-device");

        var strangerHistory = await strangerClient.GetFromJsonAsync<OrderHistoryResponse>("/api/v1/orders", JsonOptions);

        Assert.NotNull(strangerHistory);
        Assert.Empty(strangerHistory!.Items);
        Assert.Equal(0, strangerHistory.TotalCount);

        var ignoredCustomerScope = await strangerClient.GetFromJsonAsync<OrderHistoryResponse>($"/api/v1/orders?customerId={checkout.CustomerId}", JsonOptions);
        Assert.Empty(ignoredCustomerScope!.Items);

        var foreign = await strangerClient.GetAsync($"/api/v1/orders/{checkout.OrderId}");

        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
        Assert.Equal("application/problem+json", foreign.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain(checkout.OrderNumber, await foreign.Content.ReadAsStringAsync());

        var unknown = await strangerClient.GetAsync($"/api/v1/orders/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.DoesNotContain(checkout.OrderNumber, await unknown.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task OrdersEndpointsRequireCustomerTokenAndExposeNoInternalFields()
    {
        var anonymous = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/v1/orders")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/api/v1/orders/{Guid.NewGuid()}")).StatusCode);

        var checkout = await CreateOrderThroughCheckout(client, "+919876550105", "history-security-device", 1);
        var listJson = await client.GetStringAsync("/api/v1/orders");
        var detailJson = await client.GetStringAsync($"/api/v1/orders/{checkout.OrderId}");
        var detailProperties = PropertyNames(JsonDocument.Parse(detailJson).RootElement).ToArray();

        Assert.Contains("items", listJson);
        Assert.Contains("totalCount", listJson);
        Assert.Contains("address", detailJson);
        Assert.Contains("lineTotal", detailJson);
        foreach (var forbidden in new[] { "customerid", "shopid", "idempotencykey", "requestfingerprint", "tokenhash", "refreshtoken", "accesstoken", "passwordhash", "secret", "actor", "stacktrace" })
        {
            Assert.DoesNotContain(forbidden, detailProperties);
            Assert.DoesNotContain(forbidden, listJson, StringComparison.OrdinalIgnoreCase);
        }
    }

    private async Task<(Guid Id, string Number)> SeedOrderAsync(Guid customerId, DateTimeOffset createdAtUtc)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var shopId = await dbContext.PoojaShops.Select(shop => shop.Id).FirstAsync();
        var order = new OrderRecord
        {
            Id = Guid.NewGuid(),
            OrderNumber = NewOrderNumber(),
            CustomerId = customerId,
            ShopId = shopId,
            Status = OrderStatus.Pending,
            Currency = "INR",
            Subtotal = 500m,
            TaxAmount = 0m,
            DiscountAmount = 0m,
            DeliveryFee = 0m,
            TotalAmount = 500m,
            CreatedAtUtc = createdAtUtc,
            UpdatedAtUtc = createdAtUtc
        };
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();
        return (order.Id, order.OrderNumber);
    }

    private static string NewOrderNumber() => $"DRM-{Guid.NewGuid():N}"[..32];

    private async Task<CheckoutResult> CreateOrderThroughCheckout(HttpClient target, string phone, string deviceId, int quantity)
    {
        var session = await Authenticate(target, phone, deviceId);
        await factory.Services.SeedDevelopmentCatalogAsync();
        var addressResponse = await target.PostAsJsonAsync("/api/v1/addresses", AddressRequest());
        var address = await addressResponse.Content.ReadFromJsonAsync<AddressResponse>(JsonOptions);
        Assert.NotNull(address);
        var products = await target.GetFromJsonAsync<PagedProducts>("/api/v1/products?page=1&pageSize=1", JsonOptions);
        var product = products!.Items[0];
        var cartResponse = await target.PostAsJsonAsync("/api/v1/cart/items", new { productId = product.Id, quantity });
        Assert.Equal(HttpStatusCode.OK, cartResponse.StatusCode);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/orders") { Content = JsonContent.Create(new { addressId = address!.Id }) };
        request.Headers.Add("Idempotency-Key", $"history-{Guid.NewGuid():N}");
        var response = await target.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<CreatedOrderResponse>(JsonOptions);
        Assert.NotNull(order);
        var catalog = await ReadProductAsync(product.Id);
        return new CheckoutResult(session.User.Id, order!.Id, order.OrderNumber, order.Subtotal, address.Id, product.Id, catalog.Name, catalog.Sku, catalog.Price);
    }

    private async Task<(string Name, string Sku, decimal Price)> ReadProductAsync(Guid productId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        return await dbContext.Products.AsNoTracking().Where(item => item.Id == productId).Select(item => new ValueTuple<string, string, decimal>(item.Name, item.Sku, item.Price)).SingleAsync();
    }

    private async Task MutateProductAsync(Guid productId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await dbContext.Products.SingleAsync(item => item.Id == productId);
        product.Name = "Mutated Brass Diya Set";
        product.Sku = "DIYA-MUTATED";
        product.Price += 250m;
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

    private static object AddressRequest(string contactName = "Ravi Sharma", string addressLine1 = "Flat 101", string city = "Thane") => new { label = "Home", contactName, contactPhone = "+919876543210", addressLine1, addressLine2 = (string?)null, city, state = "Maharashtra", postalCode = "400601", country = "IN", latitude = 19.2183m, longitude = 72.9781m, isDefault = true };

    private static IEnumerable<string> PropertyNames(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.Object => element.EnumerateObject().SelectMany(property => new[] { property.Name.ToLowerInvariant() }.Concat(PropertyNames(property.Value))),
        JsonValueKind.Array => element.EnumerateArray().SelectMany(PropertyNames),
        _ => []
    };

    private sealed record OtpResponse(Guid ChallengeId);
    private sealed record CustomerResponse(Guid Id);
    private sealed record SessionResponse(CustomerResponse User, string AccessToken);
    private sealed record AddressResponse(Guid Id);
    private sealed record ProductResponse(Guid Id);
    private sealed record PagedProducts(IReadOnlyList<ProductResponse> Items);
    private sealed record CreatedOrderResponse(Guid Id, string OrderNumber, int Status, decimal Subtotal, decimal DeliveryFee, decimal ServiceCharge, decimal Total, string Currency, DateTimeOffset CreatedAtUtc);
    private sealed record OrderSummaryResponse(Guid Id, string OrderNumber, int Status, decimal Subtotal, decimal DeliveryCharge, decimal ServiceCharge, decimal Total, string Currency, DateTimeOffset CreatedAtUtc);
    private sealed record OrderHistoryResponse(IReadOnlyList<OrderSummaryResponse> Items, int Page, int PageSize, int TotalCount);
    private sealed record OrderItemResponse(Guid ProductId, string ProductName, string Sku, int Quantity, decimal UnitPrice, decimal TaxAmount, decimal DiscountAmount, decimal LineTotal, string Currency);
    private sealed record OrderAddressResponse(string ContactName, string ContactPhone, string AddressLine1, string? AddressLine2, string City, string State, string PostalCode, string Country, decimal? Latitude, decimal? Longitude);
    private sealed record OrderDetailsResponse(Guid Id, string OrderNumber, int Status, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc, decimal Subtotal, decimal DeliveryCharge, decimal ServiceCharge, decimal Total, string Currency, IReadOnlyList<OrderItemResponse> Items, OrderAddressResponse Address);
    private sealed record CheckoutResult(Guid CustomerId, Guid OrderId, string OrderNumber, decimal Subtotal, Guid AddressId, Guid ProductId, string ProductName, string ProductSku, decimal UnitPrice);
}