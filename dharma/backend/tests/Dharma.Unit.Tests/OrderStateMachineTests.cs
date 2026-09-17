using Dharma.Order.Domain;
using OrderAggregate = Dharma.Order.Domain.Order;

namespace Dharma.Unit.Tests;

public sealed class OrderStateMachineTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 14, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void OrderStartsPendingAndRecordsCreation()
    {
        var order = CreateOrder();

        Assert.Equal(OrderStatus.Pending, order.Status);
        var history = Assert.Single(order.StatusHistory);
        Assert.Null(history.FromStatus);
        Assert.Equal(OrderStatus.Pending, history.ToStatus);
    }

    [Fact]
    public void ValidFulfilmentTransitionsAreAppliedAndRecorded()
    {
        var order = CreateOrder();

        order.Confirm(Now.AddMinutes(1), "payment");
        order.StartProcessing(Now.AddMinutes(2), "shop");
        order.MarkReadyForDelivery(Now.AddMinutes(3), "shop");
        order.MarkOutForDelivery(Now.AddMinutes(4), "delivery");
        order.Deliver(Now.AddMinutes(5), "delivery");

        Assert.Equal(OrderStatus.Delivered, order.Status);
        Assert.Collection(order.StatusHistory,
            entry => Assert.Equal((OrderStatus?)null, entry.FromStatus),
            entry => Assert.Equal(OrderStatus.Pending, entry.FromStatus),
            entry => Assert.Equal(OrderStatus.Confirmed, entry.FromStatus),
            entry => Assert.Equal(OrderStatus.Processing, entry.FromStatus),
            entry => Assert.Equal(OrderStatus.ReadyForDelivery, entry.FromStatus),
            entry => Assert.Equal(OrderStatus.OutForDelivery, entry.FromStatus));
    }

    [Theory]
    [InlineData(OrderStatus.Pending, OrderStatus.Processing)]
    [InlineData(OrderStatus.Pending, OrderStatus.Delivered)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.OutForDelivery)]
    [InlineData(OrderStatus.ReadyForDelivery, OrderStatus.Cancelled)]
    public void InvalidTransitionsAreRejected(OrderStatus current, OrderStatus attempted)
    {
        var order = MoveTo(current);

        Assert.Throws<OrderTransitionException>(() => order.TransitionTo(attempted, Now, "test"));
        Assert.Equal(current, order.Status);
    }

    [Theory]
    [InlineData(OrderStatus.Pending)]
    [InlineData(OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Processing)]
    public void CancellationIsAllowedBeforeDeliveryHandover(OrderStatus current)
    {
        var order = MoveTo(current);

        order.Cancel(Now, "customer", "No longer needed.");

        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.Equal("No longer needed.", order.StatusHistory[^1].Reason);
    }

    [Theory]
    [InlineData(OrderStatus.Delivered)]
    [InlineData(OrderStatus.Cancelled)]
    public void TerminalStatesRejectFurtherTransitions(OrderStatus terminalStatus)
    {
        var order = terminalStatus == OrderStatus.Cancelled ? CreateOrder() : MoveTo(OrderStatus.Delivered);
        if (terminalStatus == OrderStatus.Cancelled) order.Cancel(Now, "customer");

        Assert.Throws<OrderTransitionException>(() => order.TransitionTo(OrderStatus.Cancelled, Now, "test"));
        Assert.Equal(terminalStatus, order.Status);
    }

    [Fact]
    public void RepeatedTransitionIsRejected()
    {
        var order = CreateOrder();
        order.Confirm(Now, "payment");

        Assert.Throws<OrderTransitionException>(() => order.Confirm(Now, "payment"));
    }

    [Fact]
    public void InvalidStatusValueIsRejected()
    {
        var order = CreateOrder();

        Assert.Throws<OrderTransitionException>(() => order.TransitionTo((OrderStatus)999, Now, "test"));
    }

    private static OrderAggregate CreateOrder() => new(Guid.NewGuid(), Guid.NewGuid(), Now, actor: "customer");

    private static OrderAggregate MoveTo(OrderStatus status)
    {
        var order = CreateOrder();
        if (status is OrderStatus.Confirmed or OrderStatus.Processing or OrderStatus.ReadyForDelivery or OrderStatus.OutForDelivery or OrderStatus.Delivered)
            order.Confirm(Now, "payment");
        if (status is OrderStatus.Processing or OrderStatus.ReadyForDelivery or OrderStatus.OutForDelivery or OrderStatus.Delivered)
            order.StartProcessing(Now, "shop");
        if (status is OrderStatus.ReadyForDelivery or OrderStatus.OutForDelivery or OrderStatus.Delivered)
            order.MarkReadyForDelivery(Now, "shop");
        if (status is OrderStatus.OutForDelivery or OrderStatus.Delivered)
            order.MarkOutForDelivery(Now, "delivery");
        if (status == OrderStatus.Delivered)
            order.Deliver(Now, "delivery");
        return order;
    }
}