import type { CustomerAddress } from "../../api/addresses";
import { formatCountry } from "./orderFormat";

type AddressLinesSource = Pick<
  CustomerAddress,
  "contactName" | "contactPhone" | "addressLine1" | "addressLine2" | "city" | "state" | "postalCode" | "country"
>;

/**
 * Builds the display lines for a delivery address, skipping empty optional fields.
 * Mirrors the order-details address rendering so review and snapshot share one layout.
 */
export function buildAddressLines(address: AddressLinesSource): string[] {
  return [
    address.contactName,
    address.contactPhone,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    formatCountry(address.country),
  ].filter((line): line is string => Boolean(line && line.trim().length > 0));
}