using Dharma.Pandit.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dharma.Api.Controllers;

/// <summary>
/// Customer-facing Pandit discovery. Read-only for DHARMA-BOOKING-01 (no booking creation).
/// Requires a CUSTOMER token, consistent with the other protected customer surfaces (cart, orders,
/// addresses). Only active pandits and active services are exposed; internal identifiers, provider
/// authentication, and audit data are never returned.
/// </summary>
[ApiController]
[Authorize(Roles = "CUSTOMER")]
[Route("api/v1/pandits")]
public sealed class PanditsController(IPanditQueryService panditQueryService, IAvailabilityQueryService availabilityQueryService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PanditSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPandits(
        [FromQuery] string? search,
        [FromQuery] string? city,
        [FromQuery] string? service,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = PanditQuery.Create(search, city, service, page, pageSize);
            return Ok(await panditQueryService.GetPanditsAsync(query, cancellationToken));
        }
        catch (PanditQueryException exception) { return Problem(exception.Code, exception.Status, exception.Message, "Pandit discovery request is invalid"); }
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PanditDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPandit(Guid id, CancellationToken cancellationToken)
    {
        var pandit = await panditQueryService.GetPanditAsync(id, cancellationToken);
        return pandit is null ? NotFound() : Ok(pandit);
    }

    [HttpGet("{id:guid}/services")]
    [ProducesResponseType(typeof(IReadOnlyList<PanditServiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPanditServices(Guid id, CancellationToken cancellationToken)
    {
        var services = await panditQueryService.GetPanditServicesAsync(id, cancellationToken);
        return services is null ? NotFound() : Ok(services);
    }

    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType(typeof(AvailabilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAvailability(
        Guid id,
        [FromQuery] string? date,
        [FromQuery] Guid? serviceId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = AvailabilityQuery.Create(date, serviceId);
            var availability = await availabilityQueryService.GetAvailabilityAsync(id, query, cancellationToken);
            return availability is null ? NotFound() : Ok(availability);
        }
        catch (AvailabilityQueryException exception) { return Problem(exception.Code, exception.Status, exception.Message, "Availability request is invalid"); }
    }

    private ObjectResult Problem(string code, int status, string detail, string title)
    {
        var problem = new ProblemDetails { Status = status, Title = title, Detail = detail, Type = $"https://api.dharma.local/problems/{code}", Instance = HttpContext.Request.Path };
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        return new ObjectResult(problem) { StatusCode = status, ContentTypes = ["application/problem+json"] };
    }
}
