using System.Globalization;

namespace Dharma.Pandit.Application;

/// <summary>A single bookable slot projected for the customer. Times are ISO-8601 with offset.</summary>
public sealed record AvailabilitySlotDto(
    Guid Id,
    string StartAt,
    string EndAt,
    string Status);

/// <summary>
/// Availability for a pandit+service on a given local date. Timezone is the display timezone the
/// slot times are expressed in (Asia/Kolkata for V1).
/// </summary>
public sealed record AvailabilityDto(
    string Date,
    string Timezone,
    IReadOnlyList<AvailabilitySlotDto> Slots);

/// <summary>
/// Validated availability query. <c>Date</c> is a local calendar date (yyyy-MM-dd) in the display
/// timezone; <c>ServiceId</c> scopes slots to a specific service. The service resolves the local-day
/// window to a UTC range in the infrastructure layer.
/// </summary>
public sealed record AvailabilityQuery
{
    /// <summary>Display timezone for V1. All slot times are expressed in this zone.</summary>
    public const string DisplayTimeZoneId = "Asia/Kolkata";

    public DateOnly Date { get; }
    public Guid ServiceId { get; }

    private AvailabilityQuery(DateOnly date, Guid serviceId)
    {
        Date = date;
        ServiceId = serviceId;
    }

    public static AvailabilityQuery Create(string? date, Guid? serviceId)
    {
        if (serviceId is null || serviceId == Guid.Empty)
            throw new AvailabilityQueryException("availability_service_required", 400, "A valid serviceId is required.");

        if (string.IsNullOrWhiteSpace(date) ||
            !DateOnly.TryParseExact(date.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
            throw new AvailabilityQueryException("availability_date_invalid", 400, "Provide a valid date in yyyy-MM-dd format.");

        return new AvailabilityQuery(parsedDate, serviceId.Value);
    }
}

public sealed class AvailabilityQueryException(string code, int status, string message) : Exception(message)
{
    public string Code { get; } = code;
    public int Status { get; } = status;
}

/// <summary>
/// Read-only availability queries. Returns null when the pandit or active service does not exist so
/// the controller can map it to a 404 without leaking which one was missing.
/// </summary>
public interface IAvailabilityQueryService
{
    Task<AvailabilityDto?> GetAvailabilityAsync(Guid panditId, AvailabilityQuery query, CancellationToken cancellationToken = default);
}
