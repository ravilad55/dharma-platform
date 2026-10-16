using Dharma.Pandit.Application;
using Dharma.Pandit.Domain;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

/// <summary>
/// Read-only availability queries. Slots are stored in UTC; this service resolves the requested local
/// calendar date (in the display timezone) to a UTC window, loads slots for the active pandit+service
/// in that window, and projects each slot's times back into the display timezone for the customer.
/// No holding/booking/payment/cancellation is performed in this slice.
/// </summary>
public sealed class EfAvailabilityQueryService(DharmaDbContext dbContext) : IAvailabilityQueryService
{
    public async Task<AvailabilityDto?> GetAvailabilityAsync(Guid panditId, AvailabilityQuery query, CancellationToken cancellationToken = default)
    {
        // Pandit must be active, and the service must be active and belong to this pandit. If not, the
        // caller gets a 404 that does not disclose which entity was missing or inactive.
        var panditActive = await dbContext.Pandits.AsNoTracking()
            .AnyAsync(pandit => pandit.Id == panditId && pandit.IsActive, cancellationToken);
        if (!panditActive) return null;

        var serviceActive = await dbContext.PanditServices.AsNoTracking()
            .AnyAsync(service => service.Id == query.ServiceId && service.PanditId == panditId && service.IsActive, cancellationToken);
        if (!serviceActive) return null;

        var timeZone = ResolveDisplayTimeZone();

        // Local day [00:00, next day 00:00) in the display timezone, converted to UTC for the query.
        var localStart = query.Date.ToDateTime(TimeOnly.MinValue);
        var localEnd = query.Date.AddDays(1).ToDateTime(TimeOnly.MinValue);
        var windowStartUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localStart, DateTimeKind.Unspecified), timeZone));
        var windowEndUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localEnd, DateTimeKind.Unspecified), timeZone));

        var slots = await dbContext.BookingSlots.AsNoTracking()
            .Where(slot => slot.PanditId == panditId
                && slot.ServiceId == query.ServiceId
                && slot.StartAtUtc >= windowStartUtc
                && slot.StartAtUtc < windowEndUtc)
            .OrderBy(slot => slot.StartAtUtc)
            .Select(slot => new { slot.Id, slot.StartAtUtc, slot.EndAtUtc, slot.Status })
            .ToListAsync(cancellationToken);

        var projected = slots
            .Select(slot => new AvailabilitySlotDto(
                slot.Id,
                ToDisplayIso(slot.StartAtUtc, timeZone),
                ToDisplayIso(slot.EndAtUtc, timeZone),
                ((BookingSlotStatus)slot.Status).ToString()))
            .ToList();

        return new AvailabilityDto(query.Date.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture), AvailabilityQuery.DisplayTimeZoneId, projected);
    }

    private static TimeZoneInfo ResolveDisplayTimeZone()
    {
        // Windows and Linux use different IANA/Windows ids; try the IANA id first, then the Windows id.
        foreach (var id in new[] { AvailabilityQuery.DisplayTimeZoneId, "India Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        // Fallback: fixed +05:30 offset so availability never fails on an exotic host.
        return TimeZoneInfo.CreateCustomTimeZone("Asia/Kolkata", TimeSpan.FromMinutes(330), "India Standard Time", "India Standard Time");
    }

    private static string ToDisplayIso(DateTimeOffset utc, TimeZoneInfo timeZone)
    {
        var local = TimeZoneInfo.ConvertTime(utc.ToUniversalTime(), timeZone);
        return local.ToString("yyyy-MM-ddTHH:mm:sszzz", System.Globalization.CultureInfo.InvariantCulture);
    }
}
