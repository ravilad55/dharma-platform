namespace Dharma.Pandit.Application;

/// <summary>Summary projection returned by the Pandit list endpoint. Discovery-safe fields only.</summary>
public sealed record PanditSummaryDto(
    Guid Id,
    string DisplayName,
    string? ImageUrl,
    string? ShortDescription,
    int ExperienceYears,
    string City,
    string State,
    IReadOnlyList<string> Languages,
    decimal Rating,
    int ReviewCount,
    bool IsAvailable,
    string? PrimaryServiceName,
    decimal? StartingPrice,
    string Currency);

/// <summary>Service projection nested in the Pandit detail response.</summary>
public sealed record PanditServiceDto(
    Guid Id,
    string Name,
    string? Description,
    int DurationMinutes,
    decimal Price,
    string Currency);

/// <summary>Full Pandit detail projection with its active services.</summary>
public sealed record PanditDetailsDto(
    Guid Id,
    string DisplayName,
    string? ImageUrl,
    string? Description,
    int ExperienceYears,
    string City,
    string State,
    IReadOnlyList<string> Languages,
    decimal Rating,
    int ReviewCount,
    bool IsAvailable,
    IReadOnlyList<PanditServiceDto> Services);

/// <summary>Generic paged envelope, matching the shape used by the Pooja Samagri and Orders features.</summary>
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

/// <summary>
/// Validated query parameters for Pandit discovery. Bounds match the existing catalog/order
/// conventions: page &gt;= 1, pageSize between 1 and 100 (default 20). Search matches Pandit name and
/// active service names; City and Service are optional exact/relevant filters.
/// </summary>
public sealed record PanditQuery
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 20;
    public const int MaxSearchLength = 100;

    public string? Search { get; }
    public string? City { get; }
    public string? Service { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int Skip => (Page - 1) * PageSize;

    private PanditQuery(string? search, string? city, string? service, int page, int pageSize)
    {
        Search = string.IsNullOrWhiteSpace(search) ? null : search.Trim();
        City = string.IsNullOrWhiteSpace(city) ? null : city.Trim();
        Service = string.IsNullOrWhiteSpace(service) ? null : service.Trim();
        Page = page;
        PageSize = pageSize;
    }

    public static PanditQuery Create(string? search = null, string? city = null, string? service = null, int page = 1, int pageSize = DefaultPageSize)
    {
        if (page < 1 || pageSize is < 1 or > MaxPageSize || search?.Length > MaxSearchLength || city?.Length > MaxSearchLength || service?.Length > MaxSearchLength)
            throw new PanditQueryException("pandits_query_invalid", 400, "Use page >= 1, pageSize between 1 and 100, and filter terms no longer than 100 characters.");

        return new PanditQuery(search, city, service, page, pageSize);
    }
}

public sealed class PanditQueryException(string code, int status, string message) : Exception(message)
{
    public string Code { get; } = code;
    public int Status { get; } = status;
}

/// <summary>
/// Read-only Pandit discovery queries. Implemented in the infrastructure layer against EF Core with
/// server-side projection, filtering and pagination (no full entities loaded into memory).
/// </summary>
public interface IPanditQueryService
{
    Task<PagedResult<PanditSummaryDto>> GetPanditsAsync(PanditQuery query, CancellationToken cancellationToken = default);
    Task<PanditDetailsDto?> GetPanditAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PanditServiceDto>?> GetPanditServicesAsync(Guid id, CancellationToken cancellationToken = default);
}
