import { formatCountry, formatOrderDate } from "../../src/features/orders/orderFormat";
import { getNextOrdersPageParam } from "../../src/features/orders/orderPagination";
import { getOrderStatusPresentation } from "../../src/features/orders/orderStatus";
import { formatMoney } from "../../src/utils/money";

describe("Orders presentation helpers", () => {
  it("formats INR totals with Indian digit grouping", () => {
    expect(formatMoney(798, "INR")).toBe("₹798.00");
    expect(formatMoney(1398, "INR")).toBe("₹1,398.00");
  });

  it("maps Pending and unknown statuses safely", () => {
    expect(getOrderStatusPresentation(1)).toEqual({ label: "Pending", tone: "pending" });
    expect(getOrderStatusPresentation(99)).toEqual({ label: "Status unavailable", tone: "neutral" });
  });

  it("formats dates and countries from snapshots", () => {
    expect(formatOrderDate("2026-09-15T10:30:00Z")).toBe("15 Sep 2026");
    expect(formatCountry("IN")).toBe("India");
  });

  it("continues only while orders remain", () => {
    const first = getNextOrdersPageParam({ page: 1, pageSize: 20, totalCount: 45 });
    const done = getNextOrdersPageParam({ page: 3, pageSize: 20, totalCount: 45 });
    expect(first).toBe(2);
    expect(done).toBeUndefined();
  });
});
