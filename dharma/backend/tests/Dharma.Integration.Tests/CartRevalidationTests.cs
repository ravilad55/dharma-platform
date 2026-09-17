using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dharma.Infrastructure.Persistence;
using Dharma.Order.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Integration.Tests;

public sealed class CartRevalidationIntegrationTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task RevalidationRejectsPriceChangeAfterCartWasCreated()
    {
        var (customerId, productId) = await AuthenticateAndAddProduct("+919876543311", "revalidation-price");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await db.Products.SingleAsync(item => item.Id == productId);
        product.Price += 100m;
        await db.SaveChangesAsync();

        var exception = await Assert.ThrowsAsync<CartRevalidationException>(() => scope.ServiceProvider.GetRequiredService<IOrderCartRevalidationService>().RevalidateAsync(customerId));
        Assert.Equal("cart_price_changed", exception.Code);
    }

    [Fact]
    public async Task RevalidationUsesCurrentNameAndSkuAndRejectsUnavailableProduct()
    {
        var (customerId, productId) = await AuthenticateAndAddProduct("+919876543312", "revalidation-product");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await db.Products.SingleAsync(item => item.Id == productId);
        product.Name = "Premium Brass Diya Set";
        product.Sku = "DIYA-002";
        await db.SaveChangesAsync();

        var revalidated = await scope.ServiceProvider.GetRequiredService<IOrderCartRevalidationService>().RevalidateAsync(customerId);
        Assert.Equal("Premium Brass Diya Set", Assert.Single(revalidated.Items).Product.Name);
        Assert.Equal("DIYA-002", revalidated.Items[0].Product.Sku);

        product.IsAvailable = false;
        await db.SaveChangesAsync();
        var exception = await Assert.ThrowsAsync<CartRevalidationException>(() => scope.ServiceProvider.GetRequiredService<IOrderCartRevalidationService>().RevalidateAsync(customerId));
        Assert.Equal("product_unavailable", exception.Code);
    }

    [Fact]
    public async Task RevalidationCannotReadAnotherCustomersCart()
    {
        await AuthenticateAndAddProduct("+919876543313", "revalidation-owner");
        var otherCustomerId = await Authenticate("+919876543314", "revalidation-other");
        await using var scope = factory.Services.CreateAsyncScope();

        var exception = await Assert.ThrowsAsync<CartRevalidationException>(() => scope.ServiceProvider.GetRequiredService<IOrderCartRevalidationService>().RevalidateAsync(otherCustomerId));
        Assert.Equal("cart_not_found", exception.Code);
    }

    private async Task<(Guid CustomerId, Guid ProductId)> AuthenticateAndAddProduct(string phone, string deviceId)
    {
        var customerId = await Authenticate(phone, deviceId);
        await factory.Services.SeedDevelopmentCatalogAsync();
        var product = await client.GetFromJsonAsync<PagedProducts>("/api/v1/products?page=1&pageSize=1", JsonOptions);
        var productId = product!.Items[0].Id;
        var response = await client.PostAsJsonAsync("/api/v1/cart/items", new { productId, quantity = 1 });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (customerId, productId);
    }

    private async Task<Guid> Authenticate(string phone, string deviceId)
    {
        var request = await client.PostAsJsonAsync("/api/v1/auth/request-otp", new { phoneNumber = phone, deviceId });
        var challenge = await request.Content.ReadFromJsonAsync<OtpResponse>(JsonOptions);
        Assert.True(factory.TryGetOtp(phone, out var otp));
        var verify = await client.PostAsJsonAsync("/api/v1/auth/verify-otp", new { challengeId = challenge!.ChallengeId, phoneNumber = phone, otp, deviceId });
        var session = await verify.Content.ReadFromJsonAsync<SessionResponse>(JsonOptions);
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session!.AccessToken);
        return session.User.Id;
    }

    private sealed record OtpResponse(Guid ChallengeId);
    private sealed record CustomerResponse(Guid Id);
    private sealed record SessionResponse(CustomerResponse User, string AccessToken);
    private sealed record PagedProducts(IReadOnlyList<ProductResponse> Items);
    private sealed record ProductResponse(Guid Id);
}
