using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dharma.Integration.Tests;

public sealed class CartTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task CustomerCanAddSameProductTwiceAndServerCalculatesTotal()
    {
        var token = await Authenticate("+919876543290", "cart-test-device");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var product = await GetProduct();

        var first = await client.PostAsJsonAsync("/api/v1/cart/items", new { productId = product.Id, quantity = 1, price = 0 });
        var second = await client.PostAsJsonAsync("/api/v1/cart/items", new { productId = product.Id, quantity = 2, price = 0 });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        var cart = await second.Content.ReadFromJsonAsync<CartResponse>(JsonOptions);
        Assert.NotNull(cart);
        var item = Assert.Single(cart!.Items);
        Assert.Equal(3, item.Quantity);
        Assert.Equal(product.Price, item.UnitPrice);
        Assert.Equal(product.Price * 3, cart.Subtotal);
        Assert.Equal(cart.Subtotal, cart.Total);
    }

    [Fact]
    public async Task UnauthenticatedCartRequestIsRejected()
    {
        client.DefaultRequestHeaders.Authorization = null;
        var response = await client.GetAsync("/api/v1/cart");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CartOwnershipIsDerivedFromAuthenticatedCustomer()
    {
        var firstToken = await Authenticate("+919876543291", "cart-owner-one");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", firstToken);
        var product = await GetProduct();
        var add = await client.PostAsJsonAsync("/api/v1/cart/items", new { productId = product.Id, quantity = 1 });
        Assert.Equal(HttpStatusCode.OK, add.StatusCode);

        var secondToken = await Authenticate("+919876543292", "cart-owner-two");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secondToken);
        var cart = await client.GetFromJsonAsync<CartResponse>("/api/v1/cart", JsonOptions);
        Assert.NotNull(cart);
        Assert.Empty(cart!.Items);
    }

    private async Task<string> Authenticate(string phone, string deviceId)
    {
        var request = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId });
        var requestBody = await request.Content.ReadFromJsonAsync<OtpResponse>(JsonOptions);
        Assert.NotNull(requestBody);
        Assert.True(factory.TryGetOtp(phone, out var otp));
        var verify = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new { challengeId = requestBody!.ChallengeId, phoneNumber = phone, otp, deviceId });
        var session = await verify.Content.ReadFromJsonAsync<SessionResponse>(JsonOptions);
        Assert.NotNull(session);
        return session!.AccessToken;
    }

    private async Task<ProductResponse> GetProduct()
    {
        await factory.Services.SeedDevelopmentCatalogAsync();
        var page = await client.GetFromJsonAsync<PagedProducts>("/api/v1/products?page=1&pageSize=1", JsonOptions);
        return Assert.Single(page!.Items);
    }

    private sealed record OtpResponse(Guid ChallengeId, string MaskedPhone, DateTimeOffset ExpiresAtUtc, DateTimeOffset ResendAvailableAtUtc);
    private sealed record SessionResponse(Guid SessionId, string AccessToken, DateTimeOffset AccessTokenExpiresAtUtc, string RefreshToken, DateTimeOffset RefreshTokenExpiresAtUtc, string TokenType);
    private sealed record PagedProducts(IReadOnlyList<ProductResponse> Items, int Page, int PageSize, int TotalCount);
    private sealed record ProductResponse(Guid Id, decimal Price);
    private sealed record CartResponse(Guid Id, Guid? ShopId, string? ShopName, string Currency, IReadOnlyList<CartItemResponse> Items, decimal Subtotal, decimal DeliveryCharge, decimal ServiceCharge, decimal Total, int ItemCount);
    private sealed record CartItemResponse(Guid Id, Guid ProductId, string Name, string? ImageUrl, int Quantity, decimal UnitPrice, decimal Subtotal, bool Available);
}
