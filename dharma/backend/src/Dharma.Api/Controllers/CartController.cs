using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dharma.Order.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dharma.Api.Controllers;

[ApiController]
[Authorize(Roles = "CUSTOMER")]
[Route("api/v1/cart")]
public sealed class CartController(ICartService cartService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CartDto>> Get(CancellationToken cancellationToken) => Ok(await cartService.GetAsync(CustomerId(), cancellationToken));

    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public Task<IActionResult> AddItem(AddCartItemRequest request, CancellationToken cancellationToken) => Execute(() => cartService.AddItemAsync(CustomerId(), request, cancellationToken));

    [HttpPut("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public Task<IActionResult> UpdateItem(Guid itemId, UpdateCartItemRequest request, CancellationToken cancellationToken) => Execute(() => cartService.UpdateItemAsync(CustomerId(), itemId, request, cancellationToken));

    [HttpDelete("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public Task<IActionResult> RemoveItem(Guid itemId, CancellationToken cancellationToken) => Execute(() => cartService.RemoveItemAsync(CustomerId(), itemId, cancellationToken));

    [HttpDelete]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public Task<IActionResult> Clear(CancellationToken cancellationToken) => Execute(() => cartService.ClearAsync(CustomerId(), cancellationToken));

    private async Task<IActionResult> Execute(Func<Task<CartDto>> operation)
    {
        try { return Ok(await operation()); }
        catch (CartException exception)
        {
            var problem = new ProblemDetails
            {
                Status = exception.Status,
                Title = exception.Code == "cart_shop_conflict" ? "Cart contains products from another shop" : "Cart request is invalid",
                Detail = exception.Message,
                Type = $"https://api.dharma.local/problems/{exception.Code}",
                Instance = HttpContext.Request.Path
            };
            problem.Extensions["code"] = exception.Code;
            problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
            return new ObjectResult(problem) { StatusCode = exception.Status };
        }
    }

    private Guid CustomerId() => Guid.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)
        ? userId
        : throw new UnauthorizedAccessException("Authentication is required.");
}