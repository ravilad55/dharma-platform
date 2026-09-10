using Dharma.Api.Endpoints;
using Dharma.Api.Middleware;
using Dharma.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ProblemDetailsExceptionHandler>();
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddDharmaInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseStatusCodePages(async statusCodeContext =>
{
    var response = statusCodeContext.HttpContext.Response;
    var request = statusCodeContext.HttpContext.Request;
    if (response.StatusCode == StatusCodes.Status404NotFound && request.Path.StartsWithSegments("/api"))
    {
        await Results.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Resource not found",
            type: "https://api.dharma.local/problems/not-found",
            instance: request.Path,
            extensions: new Dictionary<string, object?> { ["correlationId"] = request.HttpContext.TraceIdentifier })
            .ExecuteAsync(request.HttpContext);
    }
});

app.MapControllers();
app.MapFoundationEndpoints();

app.Run();

public partial class Program;
