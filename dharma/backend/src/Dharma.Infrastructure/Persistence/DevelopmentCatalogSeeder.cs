using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Infrastructure.Persistence;

public static class DevelopmentCatalogSeeder
{
    private static readonly Guid DevelopmentOwnerId = Guid.Parse("b6b72062-259f-4dd3-a50f-4d265f1c51e1");
    private static readonly Guid DevelopmentShopId = Guid.Parse("0f2eff0a-93e9-42a9-ae8b-2e702e4c57bb");
    private static readonly Guid KitsCategoryId = Guid.Parse("ec97e93d-85a1-4c47-a093-431edcbeb98b");
    private static readonly Guid DiyasCategoryId = Guid.Parse("9f976b53-bd47-403f-8a38-4cc063ae2cfe");
    private static readonly Guid FlowersCategoryId = Guid.Parse("d9e9f824-b952-49d4-93fa-ad0d381095e0");
    private static readonly Guid IncenseCategoryId = Guid.Parse("a17aa0cb-a552-4fae-9e28-9408351a8404");
    private static readonly Guid MoreCategoryId = Guid.Parse("e0dcbe34-24db-4caf-9b29-c2bdb9d19d47");

    public static async Task SeedDevelopmentCatalogAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        if (await dbContext.Products.AnyAsync(cancellationToken)) return;

        var now = DateTimeOffset.UtcNow;
        if (!await dbContext.IdentityUsers.AnyAsync(user => user.Id == DevelopmentOwnerId, cancellationToken))
        {
            dbContext.IdentityUsers.Add(new IdentityUserRecord
            {
                Id = DevelopmentOwnerId,
                PhoneNormalized = "+910000000000",
                PhoneLookupHash = "development-catalog-shop-owner",
                DisplayName = "Development Samagri Shop",
                IsActive = true,
                CreatedAt = now
            });
        }

        dbContext.PoojaShops.Add(new PoojaShopRecord
        {
            Id = DevelopmentShopId,
            OwnerUserId = DevelopmentOwnerId,
            Name = "Dharma Samagri Store",
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });

        var categories = new[]
        {
            new ProductCategoryRecord { Id = KitsCategoryId, Name = "Kits", SortOrder = 1, IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new ProductCategoryRecord { Id = DiyasCategoryId, Name = "Diyas", SortOrder = 2, IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new ProductCategoryRecord { Id = FlowersCategoryId, Name = "Flowers", SortOrder = 3, IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new ProductCategoryRecord { Id = IncenseCategoryId, Name = "Incense", SortOrder = 4, IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new ProductCategoryRecord { Id = MoreCategoryId, Name = "More", SortOrder = 5, IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now }
        };
        dbContext.ProductCategories.AddRange(categories);
        dbContext.Products.AddRange(
            Product("Griha Pravesh Kit", "Essential samagri for your new home ceremony.", 899m, "KIT-GP-001", KitsCategoryId, "catalog/griha-pravesh-kit.png", now),
            Product("Satyanarayan Kit", "Complete essentials for Satyanarayan Pooja.", 749m, "KIT-SP-001", KitsCategoryId, "catalog/satyanarayan-kit.png", now),
            Product("Brass Diya Set", "Set of two traditional brass diyas.", 399m, "DIY-BR-001", DiyasCategoryId, "catalog/brass-diya-set.png", now),
            Product("Marigold Flowers", "Fresh marigold flowers for daily pooja.", 149m, "FLW-MG-001", FlowersCategoryId, "catalog/marigold-flowers.png", now),
            Product("Sandalwood Incense", "Fragrant incense sticks for prayer.", 199m, "INC-SW-001", IncenseCategoryId, "catalog/sandalwood-incense.png", now));
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static ProductRecord Product(string name, string description, decimal price, string sku, Guid categoryId, string imageUrl, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        PoojaShopId = DevelopmentShopId,
        CategoryId = categoryId,
        Name = name,
        Description = description,
        Price = price,
        Currency = "INR",
        Sku = sku,
        ImageUrl = imageUrl,
        IsActive = true,
        IsAvailable = true,
        CreatedAtUtc = now,
        UpdatedAtUtc = now
    };
}