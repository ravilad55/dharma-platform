import type { CustomerAddress } from "../../api/addresses";
import { getErrorStatus, getErrorMessage } from "../../api/errors";

/**
 * Resolves which address to use for an order. The server address list is always
 * the source of truth: a previously selected address wins when it still exists,
 * otherwise the API-default address is preselected, and finally the only/last
 * address is used when the customer has exactly one. Returns null when the
 * customer has no saved addresses.
 */
export function selectPreferredAddress(
  addresses: CustomerAddress[],
  preferredAddressId: string | null
): CustomerAddress | null {
  if (preferredAddressId) {
    const preferred = addresses.find((address) => address.id === preferredAddressId);
    if (preferred) return preferred;
  }
  const defaultAddress = addresses.find((address) => address.isDefault);
  if (defaultAddress) return defaultAddress;
  return addresses[0] ?? null;
}

/**
 * User-facing error mapping for POST /orders. Internal exception details are
 * never surfaced; the client only renders friendly guidance per status class.
 */
export function getOrderCreateErrorMessage(error: unknown): string {
  const status = getErrorStatus(error);
  if (status === 409) {
    return "Your cart has changed. Please review your cart again.";
  }
  if (status === 404) {
    return "The delivery address is no longer available. Please choose another address.";
  }
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 429) {
    return "Too many requests. Please wait before trying again.";
  }
  return getErrorMessage(error, "We couldn't place your order. Please check the network and try again.");
}