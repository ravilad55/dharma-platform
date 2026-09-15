using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dharma.Order.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dharma.Api.Controllers;

[ApiController]
[Authorize(Roles = "CUSTOMER")]
[Route("api/v1/orders")]
public sealed class OrdersController(IOrderCheckoutService checkoutService, IOrderHistoryService orderHistoryService) : ControllerBase
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
        catch (OrderCheckoutException exception) { return Problem(exception.Code, exception.Status, exception.Message, "Order creation could not be completed"); }
        catch (CartRevalidationException exception) { return Problem(exception.Code, 409, exception.Message, "Order creation could not be completed"); }
        catch (ArgumentException exception) { return Problem("order_validation", 422, exception.Message, "Order creation could not be completed"); }
    }

    [HttpGet]
    [ProducesResponseType(typeof(OrderHistoryPage), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await orderHistoryService.GetOrdersAsync(CustomerId(), OrderHistoryQuery.Create(page, pageSize), cancellationToken));
        }
        catch (OrderHistoryException exception) { return Problem(exception.Code, exception.Status, exception.Message, "Order history could not be retrieved"); }
    }

    [HttpGet("{orderId:guid}")]
    [ProducesResponseType(typeof(OrderDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrder(Guid orderId, CancellationToken cancellationToken)
    {
        try
        {
            var order = await orderHistoryService.GetOrderAsync(CustomerId(), orderId, cancellationToken);
            return order is null ? NotFound() : Ok(order);
        }
        catch (OrderHistoryException exception) { return Problem(exception.Code, exception.Status, exception.Message, "Order could not be retrieved"); }
    }

    private ObjectResult Problem(string code, int status, string detail, string title)
    {
        var problem = new ProblemDetails { Status = status, Title = title, Detail = detail, Type = $"https://api.dharma.local/problems/{code}", Instance = HttpContext.Request.Path };
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        return new ObjectResult(problem) { StatusCode = status, ContentTypes = ["application/problem+json"] };
    }

    private Guid CustomerId() => Guid.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : throw new UnauthorizedAccessException("Authentication is required.");
}