using Dharma.PoojaSamagri.Application;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class PoojaSamagriCatalogQueryService(DharmaDbContext dbContext) : ICatalogQueryService
{
    public async Task<IReadOnlyList<ProductCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
        await dbContext.ProductCategories.AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .Select(category => new ProductCategoryDto(category.Id, category.Name, category.Description, category.SortOrder))
            .ToListAsync(cancellationToken);

    public async Task<PagedResult<ProductSummaryDto>> GetProductsAsync(ProductQuery query, CancellationToken cancellationToken = default)
    {
        var products = dbContext.Products.AsNoTracking()
            .Where(product => product.IsActive && product.IsAvailable && product.Category.IsActive && product.Shop.IsActive);

        if (query.CategoryId.HasValue)
            products = products.Where(product => product.CategoryId == query.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            products = products.Where(product => EF.Functions.Like(product.Name, pattern) ||
                (product.Description != null && EF.Functions.Like(product.Description, pattern)));
        }

        var totalCount = await products.CountAsync(cancellationToken);
        var items = await products.OrderBy(product => product.Name)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(product => new ProductSummaryDto(
                product.Id, product.Name, product.Description, product.Price, product.Currency, product.ImageUrl,
                new ProductCategoryDto(product.Category.Id, product.Category.Name, product.Category.Description, product.Category.SortOrder),
                product.IsAvailable, product.Shop.Name))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductSummaryDto>(items, query.Page, query.PageSize, totalCount);
    }

    public async Task<ProductDetailsDto?> GetProductAsync(Guid id, CancellationToken cancellationToken = default) =>
        await dbContext.Products.AsNoTracking()
            .Where(product => product.Id == id && product.IsActive && product.IsAvailable && product.Category.IsActive && product.Shop.IsActive)
            .Select(product => new ProductDetailsDto(
                product.Id, product.Name, product.Description, product.Price, product.Currency, product.ImageUrl,
                new ProductCategoryDto(product.Category.Id, product.Category.Name, product.Category.Description, product.Category.SortOrder),
                product.IsAvailable, product.Shop.Name))
            .SingleOrDefaultAsync(cancellationToken);
}