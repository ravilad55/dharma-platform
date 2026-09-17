const currencySymbols: Record<string, string> = {
  INR: "\u20B9",
};

/**
 * Formats a server-returned money amount for display.
 * Amounts always come from the API (order/cart DTOs); the client never recalculates order totals.
 */
export function formatMoney(amount: number, currency = "INR"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currencySymbols[currency.toUpperCase()];

  return symbol ? `${symbol}${formatted}` : `${currency} ${formatted}`;
}
