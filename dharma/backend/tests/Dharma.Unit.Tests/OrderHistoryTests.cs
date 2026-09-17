using Dharma.Order.Application;
using Dharma.Order.Domain;

namespace Dharma.Unit.Tests;

public sealed class OrderHistoryTests
{
    [Fact]
    public void Query_ComputesSkipFromPageAndPageSize()
    {
        var query = OrderHistoryQuery.Create(3, 20);

        Assert.Equal(3, query.Page);
        Assert.Equal(20, query.PageSize);
        Assert.Equal(40, query.Skip);
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(-1, 20)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void Query_RejectsInvalidPagination(int page, int pageSize)
    {
        var exception = Assert.Throws<OrderHistoryException>(() => OrderHistoryQuery.Create(page, pageSize));

        Assert.Equal("orders_pagination_invalid", exception.Code);
        Assert.Equal(400, exception.Status);
    }

    [Fact]
    public void Page_MapsCustomerVisibleSummaryFieldsOnly()
    {
        var order = Summary(OrderStatus.Confirmed, subtotal: 1000m, deliveryCharge: 40m, total: 1090m);

        var dto = Assert.Single(OrderHistoryMapper.ToPage(new OrderHistoryData([order], 1), OrderHistoryQuery.Create()).Items);

        Assert.Equal(order.Id, dto.Id);
        Assert.Equal(order.OrderNumber, dto.OrderNumber);
        Assert.Equal(OrderStatus.Confirmed, dto.Status);
        Assert.Equal(1000m, dto.Subtotal);
        Assert.Equal(40m, dto.DeliveryCharge);
        Assert.Equal(1090m, dto.Total);
        Assert.Equal("INR", dto.Currency);
        Assert.Equal(order.CreatedAtUtc, dto.CreatedAtUtc);
    }

    [Fact]
    public void Page_ReportsRequestedPaginationAndTotalCount()
    {
        var page = OrderHistoryMapper.ToPage(new OrderHistoryData([Summary(), Summary()], 7), OrderHistoryQuery.Create(2, 5));

        Assert.Equal(2, page.Items.Count);
        Assert.Equal(2, page.Page);
        Assert.Equal(5, page.PageSize);
        Assert.Equal(7, page.TotalCount);
    }

    [Fact]
    public void Summary_DerivesServiceChargeFromChargedTotal()
    {
        var summary = OrderHistoryMapper.ToSummary(Summary(OrderStatus.Pending, subtotal: 1000m, deliveryCharge: 40m, total: 1080m));

        Assert.Equal(1000m, summary.Subtotal);
        Assert.Equal(40m, summary.DeliveryCharge);
        Assert.Equal(40m, summary.ServiceCharge);
        Assert.Equal(summary.Subtotal + summary.DeliveryCharge + summary.ServiceCharge, summary.Total);
    }

    [Fact]
    public void Summary_ExposesZeroServiceChargeWhenOrderChargesOnlySubtotal()
    {
        var summary = OrderHistoryMapper.ToSummary(Summary(OrderStatus.Pending, subtotal: 798m, deliveryCharge: 0m, total: 798m));

        Assert.Equal(0m, summary.ServiceCharge);
        Assert.Equal(798m, summary.Total);
    }

    [Theory]
    [InlineData(OrderStatus.Pending)]
    [InlineData(OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Delivered)]
    [InlineData(OrderStatus.Cancelled)]
    public void Summary_ExposesPersistedOrderStatusWithoutTransition(OrderStatus status)
    {
        var summary = OrderHistoryMapper.ToSummary(Summary(status));

        Assert.Equal(status, summary.Status);
    }

    [Fact]
    public void Details_MapsProductSnapshotFieldsInsteadOfLiveProductData()
    {
        var item = OrderItemSnapshotFactory.Create(new OrderProductSnapshotData(Guid.NewGuid(), "Brass Diya Set", "DIYA-001", 399m, 9m, 20m, "INR"), 2);

        var dto = Assert.Single(OrderHistoryMapper.ToDetails(Details(item: item)).Items);

        Assert.Equal(item.ProductId, dto.ProductId);
        Assert.Equal("Brass Diya Set", dto.ProductName);
        Assert.Equal("DIYA-001", dto.Sku);
        Assert.Equal(2, dto.Quantity);
        Assert.Equal(399m, dto.UnitPrice);
        Assert.Equal(9m, dto.TaxAmount);
        Assert.Equal(20m, dto.DiscountAmount);
        Assert.Equal(776m, dto.LineTotal);
        Assert.Equal("INR", dto.Currency);
    }

    [Fact]
    public void Details_MapsImmutableAddressSnapshotWithTotalsAndTimestamps()
    {
        var summary = Summary(OrderStatus.Pending, subtotal: 798m, deliveryCharge: 0m, total: 798m);

        var details = OrderHistoryMapper.ToDetails(Details(summary: summary));

        Assert.Equal(summary.Id, details.Id);
        Assert.Equal(summary.OrderNumber, details.OrderNumber);
        Assert.Equal(OrderStatus.Pending, details.Status);
        Assert.Equal(summary.CreatedAtUtc, details.CreatedAtUtc);
        Assert.Equal(summary.UpdatedAtUtc, details.UpdatedAtUtc);
        Assert.Equal(798m, details.Total);
        Assert.Equal("INR", details.Currency);
        Assert.Equal("Ravi Sharma", details.Address.ContactName);
        Assert.Equal("+919876543210", details.Address.ContactPhone);
        Assert.Equal("Flat 101", details.Address.AddressLine1);
        Assert.Equal("Temple Road", details.Address.AddressLine2);
        Assert.Equal("Thane", details.Address.City);
        Assert.Equal("Maharashtra", details.Address.State);
        Assert.Equal("400601", details.Address.PostalCode);
        Assert.Equal("IN", details.Address.Country);
        Assert.Equal(19.2183m, details.Address.Latitude);
        Assert.Equal(72.9781m, details.Address.Longitude);
    }

    [Fact]
    public async Task Service_ReadsHistoryOnlyScopedToAuthenticatedCustomerAndRequestedPage()
    {
        var customerId = Guid.NewGuid();
        var store = new TestHistoryStore(new OrderHistoryData([Summary()], 1), Details());
        var query = OrderHistoryQuery.Create(2, 10);

        var page = await new OrderHistoryService(store).GetOrdersAsync(customerId, query);

        Assert.Equal(customerId, store.CustomerId);
        Assert.Equal(10, store.Query!.Skip);
        Assert.Equal(10, store.Query.PageSize);
        Assert.Single(page.Items);
        Assert.Equal(1, page.TotalCount);
    }

    [Fact]
    public async Task Service_ReturnsOrderDetailForOwnedOrder()
    {
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var store = new TestHistoryStore(new OrderHistoryData([], 0), Details());

        var details = await new OrderHistoryService(store).GetOrderAsync(customerId, orderId);

        Assert.Equal(customerId, store.CustomerId);
        Assert.Equal(orderId, store.OrderId);
        Assert.NotNull(details);
    }

    [Fact]
    public async Task Service_ReturnsNullWhenStoreFindsNoCustomerScopedOrder()
    {
        var store = new TestHistoryStore(new OrderHistoryData([], 0), null);
        var service = new OrderHistoryService(store);

        Assert.Null(await service.GetOrderAsync(Guid.NewGuid(), Guid.NewGuid()));
        Assert.Null(await service.GetOrderAsync(Guid.NewGuid(), Guid.Empty));
    }

    [Fact]
    public async Task Service_RejectsMissingCustomerClaim()
    {
        var service = new OrderHistoryService(new TestHistoryStore(new OrderHistoryData([], 0), Details()));

        var list = await Assert.ThrowsAsync<OrderHistoryException>(() => service.GetOrdersAsync(Guid.Empty, OrderHistoryQuery.Create()));
        var detail = await Assert.ThrowsAsync<OrderHistoryException>(() => service.GetOrderAsync(Guid.Empty, Guid.NewGuid()));

        Assert.Equal(401, list.Status);
        Assert.Equal(401, detail.Status);
    }

    private static OrderSummaryData Summary(OrderStatus status = OrderStatus.Pending, decimal subtotal = 798m, decimal deliveryCharge = 0m, decimal total = 798m) =>
        new(Guid.NewGuid(), $"DRM-{Guid.NewGuid():N}"[..32], status, subtotal, deliveryCharge, total, "INR", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow);

    private static OrderDetailsData Details(OrderSummaryData? summary = null, OrderItemSnapshot? item = null) =>
        new(summary ?? Summary(), [item ?? OrderItemSnapshotFactory.Create(new OrderProductSnapshotData(Guid.NewGuid(), "Brass Diya Set", "DIYA-001", 399m, 0m, 0m, "INR"), 2)],
            OrderAddressSnapshotFactory.Create(new OrderAddressSnapshotData("Ravi Sharma", "+919876543210", "Flat 101", "Temple Road", "Thane", "Maharashtra", "400601", "IN", 19.2183m, 72.9781m)));

    private sealed class TestHistoryStore(OrderHistoryData history, OrderDetailsData? details) : IOrderHistoryStore
    {
        public Guid CustomerId { get; private set; }
        public Guid OrderId { get; private set; }
        public OrderHistoryQuery? Query { get; private set; }

        public Task<OrderHistoryData> GetOrdersAsync(Guid customerId, OrderHistoryQuery query, CancellationToken cancellationToken)
        {
            CustomerId = customerId;
            Query = query;
            return Task.FromResult(history);
        }

        public Task<OrderDetailsData?> GetOrderAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken)
        {
            CustomerId = customerId;
            OrderId = orderId;
            return Task.FromResult(details);
        }
    }
}