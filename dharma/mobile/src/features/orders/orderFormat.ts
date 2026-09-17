import { formatMoney } from "../../utils/money";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const countryNames: Record<string, string> = {
  IN: "India",
};

/** Formats a server timestamp such as "15 Sep 2026". Invalid values render as an empty string. */
export function formatOrderDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

/** Displays the immutable order address country, preferring a readable name over the ISO code. */
export function formatCountry(code?: string | null): string {
  const key = (code ?? "").trim().toUpperCase();
  if (!key) return "";
  return countryNames[key] ?? key;
}

/** Renders the historical snapshot quantity/price line, for example "Qty 2 × ₹399.00". */
export function formatQuantityLine(quantity: number, unitPrice: number, currency: string): string {
  return `Qty ${quantity} \u00D7 ${formatMoney(unitPrice, currency)}`;
}
