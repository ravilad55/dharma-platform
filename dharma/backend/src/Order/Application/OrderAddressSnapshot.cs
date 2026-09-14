namespace Dharma.Order.Application;

public sealed record OrderAddressSnapshotData(
    string ContactName,
    string ContactPhone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    decimal? Latitude,
    decimal? Longitude);

public sealed record OrderAddressSnapshot(
    string ContactName,
    string ContactPhone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    decimal? Latitude,
    decimal? Longitude);

public static class OrderAddressSnapshotFactory
{
    public static OrderAddressSnapshot Create(OrderAddressSnapshotData address)
    {
        ArgumentNullException.ThrowIfNull(address);
        if (string.IsNullOrWhiteSpace(address.ContactName) || string.IsNullOrWhiteSpace(address.ContactPhone) || string.IsNullOrWhiteSpace(address.AddressLine1) || string.IsNullOrWhiteSpace(address.City) || string.IsNullOrWhiteSpace(address.State) || string.IsNullOrWhiteSpace(address.PostalCode) || string.IsNullOrWhiteSpace(address.Country)) throw new ArgumentException("Address details are incomplete.", nameof(address));
        if (address.PostalCode.Length is < 4 or > 20 || address.Country.Trim().Length != 2) throw new ArgumentException("Address details are invalid.", nameof(address));
        if (address.Latitude is < -90m or > 90m || address.Longitude is < -180m or > 180m) throw new ArgumentException("Address coordinates are invalid.", nameof(address));

        return new OrderAddressSnapshot(address.ContactName.Trim(), address.ContactPhone.Trim(), address.AddressLine1.Trim(), string.IsNullOrWhiteSpace(address.AddressLine2) ? null : address.AddressLine2.Trim(), address.City.Trim(), address.State.Trim(), address.PostalCode.Trim(), address.Country.Trim().ToUpperInvariant(), address.Latitude, address.Longitude);
    }
}

public interface IOrderAddressSnapshotSource
{
    Task<OrderAddressSnapshotData?> GetAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default);
}

public sealed class OrderAddressSnapshotService(IOrderAddressSnapshotSource source)
{
    public async Task<OrderAddressSnapshot> CreateAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default)
    {
        if (customerId == Guid.Empty) throw new ArgumentException("Customer is required.", nameof(customerId));
        if (addressId == Guid.Empty) throw new ArgumentException("Address is required.", nameof(addressId));
        var address = await source.GetAsync(customerId, addressId, cancellationToken) ?? throw new InvalidOperationException("The address was not found.");
        return OrderAddressSnapshotFactory.Create(address);
    }
}