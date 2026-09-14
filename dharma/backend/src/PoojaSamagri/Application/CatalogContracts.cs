namespace Dharma.PoojaSamagri.Application;

public sealed record ProductCategoryDto(Guid Id, string Name, string? Description, int SortOrder);
public sealed record ProductSummaryDto(
    Guid Id,
    string Name,
    string? ShortDescription,
    decimal Price,
    string Currency,
    string? ImageUrl,
    ProductCategoryDto Category,
    bool IsAvailable,
    string ShopName);
public sealed record ProductDetailsDto(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    string Currency,
    string? ImageUrl,
    ProductCategoryDto Category,
    bool IsAvailable,
    string ShopName);
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
public sealed record ProductQuery(Guid? CategoryId, string? Search, int Page = 1, int PageSize = 20);

public interface ICatalogQueryService
{
    Task<IReadOnlyList<ProductCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<ProductSummaryDto>> GetProductsAsync(ProductQuery query, CancellationToken cancellationToken = default);
    Task<ProductDetailsDto?> GetProductAsync(Guid id, CancellationToken cancellationToken = default);
}