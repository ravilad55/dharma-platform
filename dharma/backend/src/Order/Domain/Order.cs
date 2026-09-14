namespace Dharma.Order.Domain;

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Processing = 3,
    ReadyForDelivery = 4,
    OutForDelivery = 5,
    Delivered = 6,
    Cancelled = 7
}

public sealed record OrderStatusHistory(
    OrderStatus? FromStatus,
    OrderStatus ToStatus,
    DateTimeOffset OccurredAtUtc,
    string Actor,
    string? Reason);

public sealed class OrderTransitionException(string message) : InvalidOperationException(message);

public sealed class Order
{
    private readonly List<OrderStatusHistory> statusHistory = [];

    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CustomerId { get; init; }
    public Guid ShopId { get; init; }
    public string Currency { get; init; } = "INR";
    public OrderStatus Status { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; init; }
    public IReadOnlyList<OrderStatusHistory> StatusHistory => statusHistory;

    public Order(Guid customerId, Guid shopId, DateTimeOffset createdAtUtc, string currency = "INR", string actor = "system")
    {
        if (customerId == Guid.Empty) throw new ArgumentException("Customer is required.", nameof(customerId));
        if (shopId == Guid.Empty) throw new ArgumentException("Shop is required.", nameof(shopId));
        if (!string.Equals(currency, "INR", StringComparison.Ordinal)) throw new ArgumentException("Orders must use INR.", nameof(currency));
        if (string.IsNullOrWhiteSpace(actor)) throw new ArgumentException("Actor is required.", nameof(actor));

        CustomerId = customerId;
        ShopId = shopId;
        Currency = currency;
        CreatedAtUtc = createdAtUtc;
        Status = OrderStatus.Pending;
        statusHistory.Add(new OrderStatusHistory(null, Status, createdAtUtc, actor, "Order created."));
    }

    public void Confirm(DateTimeOffset occurredAtUtc, string actor) => TransitionTo(OrderStatus.Confirmed, occurredAtUtc, actor);
    public void StartProcessing(DateTimeOffset occurredAtUtc, string actor) => TransitionTo(OrderStatus.Processing, occurredAtUtc, actor);
    public void MarkReadyForDelivery(DateTimeOffset occurredAtUtc, string actor) => TransitionTo(OrderStatus.ReadyForDelivery, occurredAtUtc, actor);
    public void MarkOutForDelivery(DateTimeOffset occurredAtUtc, string actor) => TransitionTo(OrderStatus.OutForDelivery, occurredAtUtc, actor);
    public void Deliver(DateTimeOffset occurredAtUtc, string actor) => TransitionTo(OrderStatus.Delivered, occurredAtUtc, actor);
    public void Cancel(DateTimeOffset occurredAtUtc, string actor, string? reason = null) => TransitionTo(OrderStatus.Cancelled, occurredAtUtc, actor, reason);

    public void TransitionTo(OrderStatus nextStatus, DateTimeOffset occurredAtUtc, string actor, string? reason = null)
    {
        if (!Enum.IsDefined(nextStatus)) throw new OrderTransitionException("The order status is invalid.");
        if (string.IsNullOrWhiteSpace(actor)) throw new OrderTransitionException("An actor is required for an order status transition.");
        if (!CanTransitionTo(nextStatus)) throw new OrderTransitionException($"Order cannot transition from {Status} to {nextStatus}.");

        var previousStatus = Status;
        Status = nextStatus;
        statusHistory.Add(new OrderStatusHistory(previousStatus, nextStatus, occurredAtUtc, actor, reason));
    }

    private bool CanTransitionTo(OrderStatus nextStatus) => (Status, nextStatus) switch
    {
        (OrderStatus.Pending, OrderStatus.Confirmed) => true,
        (OrderStatus.Pending, OrderStatus.Cancelled) => true,
        (OrderStatus.Confirmed, OrderStatus.Processing) => true,
        (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
        (OrderStatus.Processing, OrderStatus.ReadyForDelivery) => true,
        (OrderStatus.Processing, OrderStatus.Cancelled) => true,
        (OrderStatus.ReadyForDelivery, OrderStatus.OutForDelivery) => true,
        (OrderStatus.OutForDelivery, OrderStatus.Delivered) => true,
        _ => false
    };
}