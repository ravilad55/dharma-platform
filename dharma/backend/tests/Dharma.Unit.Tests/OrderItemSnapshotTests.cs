using Dharma.Order.Application;

namespace Dharma.Unit.Tests;

public sealed class OrderItemSnapshotTests
{
    [Fact]
    public void Create_UsesAuthoritativeProductValuesAndCalculatesLineTotal()
    {
        var product = new OrderProductSnapshotData(Guid.NewGuid(), "Brass Diya Set", "DIYA-001", 399m, 18m, 7m, "INR");

        var snapshot = OrderItemSnapshotFactory.Create(product, 2);

        Assert.Equal("Brass Diya Set", snapshot.ProductNameSnapshot);
        Assert.Equal("DIYA-001", snapshot.SkuSnapshot);
        Assert.Equal(399m, snapshot.UnitPrice);
        Assert.Equal(18m, snapshot.TaxAmount);
        Assert.Equal(7m, snapshot.DiscountAmount);
        Assert.Equal(820m, snapshot.LineTotal);
        Assert.Equal("INR", snapshot.Currency);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Create_RejectsInvalidQuantity(int quantity)
    {
        var product = new OrderProductSnapshotData(Guid.NewGuid(), "Brass Diya Set", "DIYA-001", 399m, 0m, 0m, "INR");

        Assert.Throws<ArgumentOutOfRangeException>(() => OrderItemSnapshotFactory.Create(product, quantity));
    }

    [Fact]
    public void Create_RejectsNonInrCurrency()
    {
        var product = new OrderProductSnapshotData(Guid.NewGuid(), "Brass Diya Set", "DIYA-001", 399m, 0m, 0m, "USD");

        Assert.Throws<ArgumentException>(() => OrderItemSnapshotFactory.Create(product, 1));
    }
}