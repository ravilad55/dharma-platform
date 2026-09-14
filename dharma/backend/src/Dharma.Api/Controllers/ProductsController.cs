using Dharma.PoojaSamagri.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dharma.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class ProductsController(ICatalogQueryService catalogQueryService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("product-categories")]
    [ProducesResponseType(typeof(IReadOnlyList<ProductCategoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProductCategoryDto>>> GetCategories(CancellationToken cancellationToken) =>
        Ok(await catalogQueryService.GetCategoriesAsync(cancellationToken));

    [AllowAnonymous]
    [HttpGet("products")]
    [ProducesResponseType(typeof(PagedResult<ProductSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<ProductSummaryDto>>> GetProducts(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100 || search?.Length > 100)
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["query"] = ["Use page >= 1, pageSize between 1 and 100, and a search term no longer than 100 characters."] })
            {
                Instance = HttpContext.Request.Path
            });

        return Ok(await catalogQueryService.GetProductsAsync(new ProductQuery(categoryId, search, page, pageSize), cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("products/{id:guid}")]
    [ProducesResponseType(typeof(ProductDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailsDto>> GetProduct(Guid id, CancellationToken cancellationToken)
    {
        var product = await catalogQueryService.GetProductAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }
}