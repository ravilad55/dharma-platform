namespace Dharma.Pandit.Domain;

/// <summary>
/// Lifecycle status of a booking slot. For DHARMA-BOOKING-03 (availability viewing) these are
/// read-only: the customer sees which slots are open. Hold/Book transitions arrive in later slices.
/// </summary>
public enum BookingSlotStatus
{
    Available = 1,
    Held = 2,
    Booked = 3,
    Blocked = 4
}

/// <summary>
/// An explicit, slot-based availability window for a Pandit and a specific service. Timestamps are
/// stored in UTC; the API converts/labels them for the customer's display timezone (Asia/Kolkata in
/// V1). A slot belongs to exactly one Pandit and references the service it is scheduled for so the
/// slot length matches the service duration.
///
/// This is a read-only discovery entity in BOOKING-03: no holding, booking, payment, or cancellation
/// is implemented here.
/// </summary>
public sealed class BookingSlot
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid PanditId { get; init; }
    public required Guid ServiceId { get; init; }
    public DateTimeOffset StartAtUtc { get; init; }
    public DateTimeOffset EndAtUtc { get; init; }
    public BookingSlotStatus Status { get; init; } = BookingSlotStatus.Available;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
