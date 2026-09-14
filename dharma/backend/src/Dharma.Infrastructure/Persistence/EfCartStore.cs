using Dharma.Order.Application;
using Dharma.Order.Domain;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class EfCartStore(DharmaDbContext dbContext) : ICartStore, IOrderCartRevalidationStore
{
    public async Task<CartDto> ReadAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var cart = await dbContext.Carts.AsNoTracking().SingleOrDefaultAsync(x => x.CustomerId == customerId, cancellationToken);
        if (cart is null) return new CartDto(Guid.Empty, null, null, "INR", [], 0m, 0m, 0m, 0m, 0);
        var rows = await (from item in dbContext.CartItems.AsNoTracking()
                          join product in dbContext.Products.AsNoTracking() on item.ProductId equals product.Id
                          join shop in dbContext.PoojaShops.AsNoTracking() on product.PoojaShopId equals shop.Id
                          where item.CartId == cart.Id
                          select new { item.Id, item.ProductId, ProductName = product.Name, product.ImageUrl, item.Quantity, item.UnitPrice, product.IsAvailable, ShopName = shop.Name })
            .ToListAsync(cancellationToken);
        var items = rows.Select(row => new CartItemDto(row.Id, row.ProductId, row.ProductName, row.ImageUrl, row.Quantity, row.UnitPrice, row.UnitPrice * row.Quantity, row.IsAvailable)).ToArray();
        var subtotal = items.Sum(item => item.Subtotal);
        return new CartDto(cart.Id, cart.ShopId, rows.FirstOrDefault()?.ShopName, cart.Currency, items, subtotal, 0m, 0m, subtotal, items.Sum(item => item.Quantity));
    }

    public Task<CartProductData?> GetProductAsync(Guid productId, CancellationToken cancellationToken) => dbContext.Products.AsNoTracking().Where(x => x.Id == productId)
        .Select(x => new CartProductData(x.Id, x.PoojaShopId, x.Shop.Name, x.Name, x.ImageUrl, x.Price, x.Currency, x.IsActive && x.IsAvailable && x.Category.IsActive && x.Shop.IsActive))
        .SingleOrDefaultAsync(cancellationToken);

    public Task<bool> CartExistsAsync(Guid customerId, CancellationToken cancellationToken) => dbContext.Carts.AnyAsync(x => x.CustomerId == customerId, cancellationToken);

    public async Task CreateCartAsync(Guid customerId, Guid shopId, string currency, CancellationToken cancellationToken)
    {
        dbContext.Carts.Add(new CartRecord { Id = Guid.NewGuid(), CustomerId = customerId, ShopId = shopId, Currency = currency, CreatedAtUtc = DateTimeOffset.UtcNow, UpdatedAtUtc = DateTimeOffset.UtcNow });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<(Guid ShopId, string Currency)?> GetCartHeaderAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var cart = await dbContext.Carts.AsNoTracking().SingleOrDefaultAsync(x => x.CustomerId == customerId, cancellationToken);
        return cart?.ShopId is { } shopId ? (shopId, cart.Currency) : null;
    }

    public Task<Guid?> GetCartItemProductIdAsync(Guid customerId, Guid itemId, CancellationToken cancellationToken) =>
        (from item in dbContext.CartItems.AsNoTracking() join cart in dbContext.Carts.AsNoTracking() on item.CartId equals cart.Id where item.Id == itemId && cart.CustomerId == customerId select (Guid?)item.ProductId).SingleOrDefaultAsync(cancellationToken);

    public async Task AddOrIncreaseItemAsync(Guid customerId, CartProductData product, int quantity, CancellationToken cancellationToken)
    {
        var cart = await dbContext.Carts.SingleAsync(x => x.CustomerId == customerId, cancellationToken);
        var item = await dbContext.CartItems.SingleOrDefaultAsync(x => x.CartId == cart.Id && x.ProductId == product.Id, cancellationToken);
        if (item is null) dbContext.CartItems.Add(new CartItemRecord { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = product.Id, Quantity = quantity, UnitPrice = product.Price, Currency = product.Currency, CreatedAtUtc = DateTimeOffset.UtcNow, UpdatedAtUtc = DateTimeOffset.UtcNow });
        else { item.Quantity += quantity; item.UnitPrice = product.Price; item.UpdatedAtUtc = DateTimeOffset.UtcNow; }
        cart.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateItemAsync(Guid customerId, Guid itemId, int quantity, CartProductData product, CancellationToken cancellationToken)
    {
        var item = await (from row in dbContext.CartItems join cart in dbContext.Carts on row.CartId equals cart.Id where row.Id == itemId && cart.CustomerId == customerId select row).SingleOrDefaultAsync(cancellationToken) ?? throw new CartException("cart_item_not_found", 404, "The cart item was not found.");
        item.Quantity = quantity; item.UnitPrice = product.Price; item.Currency = product.Currency; item.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveItemAsync(Guid customerId, Guid itemId, CancellationToken cancellationToken)
    {
        var item = await (from row in dbContext.CartItems join cart in dbContext.Carts on row.CartId equals cart.Id where row.Id == itemId && cart.CustomerId == customerId select row).SingleOrDefaultAsync(cancellationToken);
        if (item is not null) { dbContext.CartItems.Remove(item); await dbContext.SaveChangesAsync(cancellationToken); }
    }

    public async Task ClearItemsAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var items = await (from row in dbContext.CartItems join cart in dbContext.Carts on row.CartId equals cart.Id where cart.CustomerId == customerId select row).ToListAsync(cancellationToken);
        dbContext.CartItems.RemoveRange(items);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<CartRevalidationData?> GetAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var cart = await dbContext.Carts.AsNoTracking().SingleOrDefaultAsync(item => item.CustomerId == customerId, cancellationToken);
        if (cart?.ShopId is not { } shopId) return null;
        var rows = await (from cartItem in dbContext.CartItems.AsNoTracking()
                          join product in dbContext.Products.AsNoTracking() on cartItem.ProductId equals product.Id into products
                          from product in products.DefaultIfEmpty()
                          join category in dbContext.ProductCategories.AsNoTracking() on product.CategoryId equals category.Id into categories
                          from category in categories.DefaultIfEmpty()
                          join shop in dbContext.PoojaShops.AsNoTracking() on product.PoojaShopId equals shop.Id into shops
                          from shop in shops.DefaultIfEmpty()
                          where cartItem.CartId == cart.Id
                          select new { cartItem.Id, cartItem.ProductId, cartItem.Quantity, cartItem.UnitPrice, cartItem.Currency, Product = product, Category = category, Shop = shop })
            .ToListAsync(cancellationToken);
        var items = rows.Select(row => new CartRevalidationItemData(
            row.Id,
            row.ProductId,
            row.Quantity,
            row.UnitPrice,
            row.Currency,
            row.Product is null || row.Category is null || row.Shop is null
                ? null
                : new RevalidationProductData(row.Product.PoojaShopId, new OrderProductSnapshotData(row.Product.Id, row.Product.Name, row.Product.Sku, row.Product.Price, 0m, 0m, row.Product.Currency), row.Product.IsActive && row.Product.IsAvailable && row.Category.IsActive && row.Shop.IsActive)))
            .ToArray();
        return new CartRevalidationData(cart.Id, cart.CustomerId, shopId, cart.Currency, items);
    }
}