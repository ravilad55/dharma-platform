using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dharma.Identity.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Dharma.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(IAuthService authService, IOptions<AuthPolicyOptions> policy) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("request-otp")]
    public async Task<IActionResult> RequestOtp(OtpRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.RequestOtpAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
            return Accepted(result);
        }
        catch (AuthException exception) { return Problem(exception); }
    }

    [AllowAnonymous]
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(VerifyOtpRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.VerifyOtpAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
            return Ok(result);
        }
        catch (AuthException exception) { return Problem(exception); }
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await authService.RefreshAsync(request, cancellationToken)); }
        catch (AuthException exception) { return Problem(exception); }
    }

    [Authorize(Roles = "CUSTOMER")]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetIdentity(out var userId, out _)) return Unauthorized();
        try
        {
            await authService.LogoutAsync(userId, request, cancellationToken);
            return NoContent();
        }
        catch (AuthException exception) { return Problem(exception); }
    }

    [Authorize(Roles = "CUSTOMER")]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        if (!TryGetIdentity(out var userId, out var sessionId)) return Unauthorized();
        try { return Ok(await authService.GetCurrentUserAsync(userId, sessionId, cancellationToken)); }
        catch (AuthException exception) { return Problem(exception); }
    }

    private bool TryGetIdentity(out Guid userId, out Guid sessionId)
    {
        return Guid.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out userId)
            && Guid.TryParse(User.FindFirstValue("sid"), out sessionId);
    }

    private ObjectResult Problem(AuthException exception)
    {
        if (exception.RetryAfter.HasValue) Response.Headers.RetryAfter = ((int)Math.Ceiling(exception.RetryAfter.Value.TotalSeconds)).ToString();
        return Problem(statusCode: exception.StatusCode, title: exception.Message, type: $"https://api.dharma.local/problems/{exception.Code}", extensions: new Dictionary<string, object?> { ["code"] = exception.Code, ["traceId"] = HttpContext.TraceIdentifier });
    }
}
