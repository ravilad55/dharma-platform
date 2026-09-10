using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Dharma.Api.Middleware;

public sealed partial class ProblemDetailsExceptionHandler : IExceptionHandler
{
    private readonly ILogger<ProblemDetailsExceptionHandler> logger;

    public ProblemDetailsExceptionHandler(ILogger<ProblemDetailsExceptionHandler> logger)
    {
        this.logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        LogUnhandledRequestFailure(exception, httpContext.Request.Path);
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await Results.Problem(
            statusCode: httpContext.Response.StatusCode,
            title: "Request failed",
            type: "https://api.dharma.local/problems/request-failed",
            instance: httpContext.Request.Path,
            extensions: new Dictionary<string, object?> { ["correlationId"] = httpContext.TraceIdentifier })
            .ExecuteAsync(httpContext);
        return true;
    }

    [LoggerMessage(EventId = 1000, Level = LogLevel.Error, Message = "Unhandled request failure for {Path}")]
    private partial void LogUnhandledRequestFailure(Exception exception, string path);
}
