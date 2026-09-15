import type { StatusTone } from "../../design-system";

export type OrderStatusPresentation = {
  label: string;
  tone: StatusTone;
};

/**
 * Presentation-only labels for the server-owned order status codes.
 * The client never invents or changes status; it only renders what the API returns.
 */
const orderStatusPresentations: Record<number, OrderStatusPresentation> = {
  1: { label: "Pending", tone: "pending" },
  2: { label: "Confirmed", tone: "confirmed" },
  3: { label: "Processing", tone: "progress" },
  4: { label: "Ready for Delivery", tone: "progress" },
  5: { label: "Out for Delivery", tone: "progress" },
  6: { label: "Delivered", tone: "delivered" },
  7: { label: "Cancelled", tone: "cancelled" },
};

/**
 * Neutral fallback so a future server status never breaks the screen.
 * The label is always rendered as text, so status is never conveyed by colour alone.
 */
const unknownOrderStatus: OrderStatusPresentation = { label: "Status unavailable", tone: "neutral" };

export function getOrderStatusPresentation(status: number | null | undefined): OrderStatusPresentation {
  if (typeof status !== "number" || !Number.isFinite(status)) return unknownOrderStatus;
  return orderStatusPresentations[status] ?? unknownOrderStatus;
}
