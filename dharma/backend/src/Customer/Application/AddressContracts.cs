using Dharma.Customer.Domain;
using Dharma.SharedKernel.Abstractions;

namespace Dharma.Customer.Application;

public sealed record AddressRequest(string Label, string ContactName, string ContactPhone, string AddressLine1, string? AddressLine2, string City, string State, string PostalCode, string Country, decimal? Latitude, decimal? Longitude, bool IsDefault);
public sealed record CustomerAddressDto(Guid Id, string Label, string ContactName, string ContactPhone, string AddressLine1, string? AddressLine2, string City, string State, string PostalCode, string Country, decimal? Latitude, decimal? Longitude, bool IsDefault, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc);
public sealed class AddressException(string code, int status, string message) : Exception(message) { public string Code { get; } = code; public int Status { get; } = status; }

public interface IAddressService
{
    Task<IReadOnlyList<CustomerAddressDto>> GetAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<CustomerAddressDto> CreateAsync(Guid customerId, AddressRequest request, CancellationToken cancellationToken = default);
    Task<CustomerAddressDto> UpdateAsync(Guid customerId, Guid addressId, AddressRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default);
}

public interface IAddressStore
{
    Task<IReadOnlyList<CustomerAddressDto>> GetAsync(Guid customerId, CancellationToken cancellationToken);
    Task<CustomerAddress?> GetAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken);
    Task<bool> HasAddressesAsync(Guid customerId, CancellationToken cancellationToken);
    Task ClearDefaultAsync(Guid customerId, CancellationToken cancellationToken);
    Task SaveAsync(CustomerAddress address, CancellationToken cancellationToken);
    Task DeleteAsync(CustomerAddress address, CancellationToken cancellationToken);
}

public sealed class AddressService(IAddressStore store, ITransactionBoundary transactionBoundary, IDistributedLock distributedLock, TimeProvider clock) : IAddressService
{
    public Task<IReadOnlyList<CustomerAddressDto>> GetAsync(Guid customerId, CancellationToken cancellationToken = default) => store.GetAsync(customerId, cancellationToken);
    public async Task<CustomerAddressDto> CreateAsync(Guid customerId, AddressRequest request, CancellationToken cancellationToken = default)
    {
        await using var addressLock = await LockAsync(customerId, cancellationToken);
        var isDefault = request.IsDefault || !await store.HasAddressesAsync(customerId, cancellationToken);
        var address = new CustomerAddress(customerId, Details(request), isDefault, clock.GetUtcNow());
        await transactionBoundary.ExecuteAsync(async ct => { if (isDefault) await store.ClearDefaultAsync(customerId, ct); await store.SaveAsync(address, ct); }, cancellationToken);
        return (await store.GetAsync(customerId, cancellationToken)).Single(item => item.Id == address.Id);
    }
    public async Task<CustomerAddressDto> UpdateAsync(Guid customerId, Guid addressId, AddressRequest request, CancellationToken cancellationToken = default)
    {
        await using var addressLock = await LockAsync(customerId, cancellationToken);
        var address = await store.GetAsync(customerId, addressId, cancellationToken) ?? throw new AddressException("address_not_found", 404, "The address was not found.");
        address.Update(Details(request), request.IsDefault, clock.GetUtcNow());
        await transactionBoundary.ExecuteAsync(async ct => { if (request.IsDefault) await store.ClearDefaultAsync(customerId, ct); await store.SaveAsync(address, ct); }, cancellationToken);
        return (await store.GetAsync(customerId, cancellationToken)).Single(item => item.Id == address.Id);
    }
    public async Task DeleteAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default)
    {
        await using var addressLock = await LockAsync(customerId, cancellationToken);
        var address = await store.GetAsync(customerId, addressId, cancellationToken) ?? throw new AddressException("address_not_found", 404, "The address was not found.");
        await transactionBoundary.ExecuteAsync(ct => store.DeleteAsync(address, ct), cancellationToken);
    }
    private async Task<IAsyncDisposable> LockAsync(Guid customerId, CancellationToken cancellationToken) => await distributedLock.TryAcquireAsync($"address:customer:{customerId}", TimeSpan.FromSeconds(10), cancellationToken) ?? throw new AddressException("address_concurrent", 409, "Addresses are being updated. Please try again.");
    private static CustomerAddressDetails Details(AddressRequest request) => new(request.Label, request.ContactName, request.ContactPhone, request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country, request.Latitude, request.Longitude);
}