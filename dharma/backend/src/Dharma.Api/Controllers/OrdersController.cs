using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dharma.Order.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dharma.Api.Controllers;

[ApiController]
[Authorize(Roles = "CUSTOMER")]
[Route("api/v1/orders")]
public sealed class OrdersController(IOrderCheckoutService checkoutService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(OrderCreatedDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create(CreateOrderRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey, CancellationToken cancellationToken)
    {
        try
        {
            var order = await checkoutService.CreateAsync(CustomerId(), request, idempotencyKey ?? string.Empty, cancellationToken);
            return Created($"/api/v1/orders/{order.Id}", order);
        }
        catch (OrderCheckoutException exception) { return Problem(exception.Code, exception.Status, exception.Message); }
        catch (CartRevalidationException exception) { return Problem(exception.Code, 409, exception.Message); }
        catch (ArgumentException exception) { return Problem("order_validation", 422, exception.Message); }
    }

    private ObjectResult Problem(string code, int status, string detail)
    {
        var problem = new ProblemDetails { Status = status, Title = "Order creation could not be completed", Detail = detail, Type = $"https://api.dharma.local/problems/{code}", Instance = HttpContext.Request.Path };
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        return new ObjectResult(problem) { StatusCode = status, ContentTypes = ["application/problem+json"] };
    }

    private Guid CustomerId() => Guid.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : throw new UnauthorizedAccessException("Authentication is required.");
}