namespace Dharma.Pandit.Domain;

/// <summary>
/// A Pandit is a spiritual-services provider that a customer can discover and (in a later slice) book.
/// A Pandit is a distinct provider identity: it is NOT a Customer and does not reuse customer/address
/// records. Provider authentication and onboarding arrive in a later slice; for DHARMA-BOOKING-01 a
/// Pandit is a read-only, discoverable catalog entity.
/// </summary>
public sealed class Pandit
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string DisplayName { get; init; }
    public string? ImageUrl { get; init; }
    public string? ShortDescription { get; init; }
    public int ExperienceYears { get; init; }
    public required string City { get; init; }
    public required string State { get; init; }

    /// <summary>Spoken/ritual languages offered, e.g. "Marathi", "Hindi", "Sanskrit".</summary>
    public IReadOnlyList<string> Languages { get; init; } = [];

    /// <summary>Aggregate rating (0-5). Server-owned: never accepted from a customer.</summary>
    public decimal Rating { get; init; }

    /// <summary>Number of reviews backing the rating. Server-owned: never accepted from a customer.</summary>
    public int ReviewCount { get; init; }

    public bool IsAvailable { get; init; } = true;

    /// <summary>Visibility flag. Inactive pandits are never exposed through discovery.</summary>
    public bool IsActive { get; init; } = true;

    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// A bookable service offered by a Pandit (e.g. Satyanarayan Puja). Prices are INR for V1 and use
/// decimal money. A service belongs to exactly one Pandit.
/// </summary>
public sealed class PanditService
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid PanditId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public int DurationMinutes { get; init; }
    public decimal Price { get; init; }
    public string Currency { get; init; } = "INR";

    /// <summary>Only active services are exposed through discovery.</summary>
    public bool IsActive { get; init; } = true;

    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
