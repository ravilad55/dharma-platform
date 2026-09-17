using Dharma.Customer.Application;
using Dharma.Customer.Domain;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class EfAddressStore(DharmaDbContext dbContext) : IAddressStore
{
    public async Task<IReadOnlyList<CustomerAddressDto>> GetAsync(Guid customerId, CancellationToken cancellationToken) => await dbContext.CustomerAddresses.AsNoTracking().Where(address => address.CustomerId == customerId).OrderByDescending(address => address.IsDefault).ThenByDescending(address => address.UpdatedAtUtc).ThenBy(address => address.Id).Select(address => ToDto(address)).ToListAsync(cancellationToken);
    public async Task<CustomerAddress?> GetAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken) => (await dbContext.CustomerAddresses.AsNoTracking().SingleOrDefaultAsync(address => address.Id == addressId && address.CustomerId == customerId, cancellationToken)) is { } record ? ToDomain(record) : null;
    public Task<bool> HasAddressesAsync(Guid customerId, CancellationToken cancellationToken) => dbContext.CustomerAddresses.AnyAsync(address => address.CustomerId == customerId, cancellationToken);
    public async Task ClearDefaultAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var defaults = await dbContext.CustomerAddresses.Where(address => address.CustomerId == customerId && address.IsDefault).ToListAsync(cancellationToken);
        foreach (var address in defaults) { address.IsDefault = false; address.DefaultForCustomerId = null; address.UpdatedAtUtc = DateTimeOffset.UtcNow; }
        await dbContext.SaveChangesAsync(cancellationToken);
    }
    public async Task SaveAsync(CustomerAddress address, CancellationToken cancellationToken)
    {
        var record = await dbContext.CustomerAddresses.SingleOrDefaultAsync(item => item.Id == address.Id, cancellationToken);
        if (record is null) dbContext.CustomerAddresses.Add(ToRecord(address)); else Apply(record, address);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
    public async Task DeleteAsync(CustomerAddress address, CancellationToken cancellationToken)
    {
        var record = await dbContext.CustomerAddresses.SingleAsync(item => item.Id == address.Id && item.CustomerId == address.CustomerId, cancellationToken);
        dbContext.CustomerAddresses.Remove(record);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
    private static CustomerAddressDto ToDto(CustomerAddressRecord address) => new(address.Id, address.Label, address.ContactName, address.ContactPhone, address.AddressLine1, address.AddressLine2, address.City, address.State, address.PostalCode, address.Country, address.Latitude, address.Longitude, address.IsDefault, address.CreatedAtUtc, address.UpdatedAtUtc);
    private static CustomerAddress ToDomain(CustomerAddressRecord address)
    {
        var domain = new CustomerAddress(address.CustomerId, new CustomerAddressDetails(address.Label, address.ContactName, address.ContactPhone, address.AddressLine1, address.AddressLine2, address.City, address.State, address.PostalCode, address.Country, address.Latitude, address.Longitude), address.IsDefault, address.CreatedAtUtc) { Id = address.Id };
        domain.RestoreUpdatedAt(address.UpdatedAtUtc);
        return domain;
    }
    private static CustomerAddressRecord ToRecord(CustomerAddress address) => new() { Id = address.Id, CustomerId = address.CustomerId, DefaultForCustomerId = address.IsDefault ? address.CustomerId : null, Label = address.Label, ContactName = address.ContactName, ContactPhone = address.ContactPhone, AddressLine1 = address.AddressLine1, AddressLine2 = address.AddressLine2, City = address.City, State = address.State, PostalCode = address.PostalCode, Country = address.Country, Latitude = address.Latitude, Longitude = address.Longitude, IsDefault = address.IsDefault, CreatedAtUtc = address.CreatedAtUtc, UpdatedAtUtc = address.UpdatedAtUtc };
    private static void Apply(CustomerAddressRecord record, CustomerAddress address) { record.DefaultForCustomerId = address.IsDefault ? address.CustomerId : null; record.Label = address.Label; record.ContactName = address.ContactName; record.ContactPhone = address.ContactPhone; record.AddressLine1 = address.AddressLine1; record.AddressLine2 = address.AddressLine2; record.City = address.City; record.State = address.State; record.PostalCode = address.PostalCode; record.Country = address.Country; record.Latitude = address.Latitude; record.Longitude = address.Longitude; record.IsDefault = address.IsDefault; record.UpdatedAtUtc = address.UpdatedAtUtc; }
}