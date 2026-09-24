namespace Dharma.Infrastructure.Persistence;

/// <summary>
/// Persistence record for a Pandit provider. Languages are stored as a single delimited column
/// (see DharmaDbContext value conversion) to keep the discovery slice free of an extra join table.
/// </summary>
public sealed class PanditRecord
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? ShortDescription { get; set; }
    public int ExperienceYears { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public List<string> Languages { get; set; } = [];
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

/// <summary>Persistence record for a service offered by a Pandit. Money uses decimal(18,2).</summary>
public sealed class PanditServiceRecord
{
    public Guid Id { get; set; }
    public Guid PanditId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "INR";
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public PanditRecord Pandit { get; set; } = null!;
}
