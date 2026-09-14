using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dharma.Customer.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dharma.Api.Controllers;

[ApiController]
[Authorize(Roles = "CUSTOMER")]
[Route("api/v1/addresses")]
public sealed class AddressesController(IAddressService addressService) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<IReadOnlyList<CustomerAddressDto>>> Get(CancellationToken cancellationToken) => Ok(await addressService.GetAsync(CustomerId(), cancellationToken));
    [HttpPost] public Task<IActionResult> Create(AddressRequest request, CancellationToken cancellationToken) => Execute(() => addressService.CreateAsync(CustomerId(), request, cancellationToken));
    [HttpPut("{id:guid}")] public Task<IActionResult> Update(Guid id, AddressRequest request, CancellationToken cancellationToken) => Execute(() => addressService.UpdateAsync(CustomerId(), id, request, cancellationToken));
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken) { try { await addressService.DeleteAsync(CustomerId(), id, cancellationToken); return NoContent(); } catch (AddressException exception) { return Problem(exception); } }
    private async Task<IActionResult> Execute(Func<Task<CustomerAddressDto>> operation) { try { return Ok(await operation()); } catch (AddressException exception) { return Problem(exception); } catch (ArgumentException exception) { return Problem(new AddressException("address_validation", 422, exception.Message)); } }
    private ObjectResult Problem(AddressException exception) { var details = new ProblemDetails { Status = exception.Status, Title = "Address request is invalid", Detail = exception.Message, Type = $"https://api.dharma.local/problems/{exception.Code}", Instance = HttpContext.Request.Path }; details.Extensions["code"] = exception.Code; details.Extensions["traceId"] = HttpContext.TraceIdentifier; return new ObjectResult(details) { StatusCode = exception.Status, ContentTypes = ["application/problem+json"] }; }
    private Guid CustomerId() => Guid.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : throw new UnauthorizedAccessException("Authentication is required.");
}