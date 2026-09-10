using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Dharma.Api.Endpoints;

public static class FoundationEndpoints
{
    public static IEndpointRouteBuilder MapFoundationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1", () => TypedResults.Ok(new { name = "Dharma API", version = "v1" }));
        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
        endpoints.MapHealthChecks("/health/ready");
        return endpoints;
    }
}
