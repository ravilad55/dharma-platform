namespace Dharma.Customer.Domain;

public sealed class CustomerAddress
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CustomerId { get; init; }
    public string Label { get; private set; } = string.Empty;
    public string ContactName { get; private set; } = string.Empty;
    public string ContactPhone { get; private set; } = string.Empty;
    public string AddressLine1 { get; private set; } = string.Empty;
    public string? AddressLine2 { get; private set; }
    public string City { get; private set; } = string.Empty;
    public string State { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    public decimal? Latitude { get; private set; }
    public decimal? Longitude { get; private set; }
    public bool IsDefault { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; init; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public CustomerAddress(Guid customerId, CustomerAddressDetails details, bool isDefault, DateTimeOffset now)
    {
        if (customerId == Guid.Empty) throw new ArgumentException("Customer is required.", nameof(customerId));
        CustomerId = customerId;
        Apply(details, now);
        IsDefault = isDefault;
        CreatedAtUtc = now;
    }

    public void Update(CustomerAddressDetails details, bool isDefault, DateTimeOffset now)
    {
        Apply(details, now);
        IsDefault = isDefault;
    }

    public void RestoreUpdatedAt(DateTimeOffset updatedAtUtc) => UpdatedAtUtc = updatedAtUtc;

    private void Apply(CustomerAddressDetails details, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(details);
        if (string.IsNullOrWhiteSpace(details.Label) || string.IsNullOrWhiteSpace(details.ContactName) || string.IsNullOrWhiteSpace(details.ContactPhone) || string.IsNullOrWhiteSpace(details.AddressLine1) || string.IsNullOrWhiteSpace(details.City) || string.IsNullOrWhiteSpace(details.State) || string.IsNullOrWhiteSpace(details.PostalCode) || string.IsNullOrWhiteSpace(details.Country)) throw new ArgumentException("Address details are incomplete.", nameof(details));
        if (details.PostalCode.Length is < 4 or > 20 || details.Country.Length != 2) throw new ArgumentException("Address details are invalid.", nameof(details));
        if (details.Latitude is < -90m or > 90m || details.Longitude is < -180m or > 180m) throw new ArgumentException("Address coordinates are invalid.", nameof(details));
        Label = details.Label.Trim(); ContactName = details.ContactName.Trim(); ContactPhone = details.ContactPhone.Trim(); AddressLine1 = details.AddressLine1.Trim(); AddressLine2 = string.IsNullOrWhiteSpace(details.AddressLine2) ? null : details.AddressLine2.Trim(); City = details.City.Trim(); State = details.State.Trim(); PostalCode = details.PostalCode.Trim(); Country = details.Country.Trim().ToUpperInvariant(); Latitude = details.Latitude; Longitude = details.Longitude; UpdatedAtUtc = now;
    }
}

public sealed record CustomerAddressDetails(string Label, string ContactName, string ContactPhone, string AddressLine1, string? AddressLine2, string City, string State, string PostalCode, string Country, decimal? Latitude, decimal? Longitude);