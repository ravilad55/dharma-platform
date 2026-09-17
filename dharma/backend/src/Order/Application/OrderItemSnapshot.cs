namespace Dharma.Order.Application;

public sealed record OrderProductSnapshotData(
    Guid ProductId,
    string Name,
    string Sku,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal DiscountAmount,
    string Currency);

public sealed record OrderItemSnapshot(
    Guid ProductId,
    string ProductNameSnapshot,
    string SkuSnapshot,
    int Quantity,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal LineTotal,
    string Currency);

public static class OrderItemSnapshotFactory
{
    public static OrderItemSnapshot Create(OrderProductSnapshotData product, int quantity)
    {
        ArgumentNullException.ThrowIfNull(product);
        if (product.ProductId == Guid.Empty) throw new ArgumentException("Product is required.", nameof(product));
        if (string.IsNullOrWhiteSpace(product.Name)) throw new ArgumentException("Product name is required.", nameof(product));
        if (string.IsNullOrWhiteSpace(product.Sku)) throw new ArgumentException("Product SKU is required.", nameof(product));
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        if (!string.Equals(product.Currency, "INR", StringComparison.Ordinal)) throw new ArgumentException("Order items must use INR.", nameof(product));
        if (product.UnitPrice < 0 || product.TaxAmount < 0 || product.DiscountAmount < 0) throw new ArgumentOutOfRangeException(nameof(product), "Snapshot money values cannot be negative.");

        var lineTotal = (product.UnitPrice + product.TaxAmount - product.DiscountAmount) * quantity;
        if (lineTotal < 0) throw new ArgumentOutOfRangeException(nameof(product), "Snapshot line total cannot be negative.");

        return new OrderItemSnapshot(product.ProductId, product.Name, product.Sku, quantity, product.UnitPrice, product.TaxAmount, product.DiscountAmount, lineTotal, product.Currency);
    }
}