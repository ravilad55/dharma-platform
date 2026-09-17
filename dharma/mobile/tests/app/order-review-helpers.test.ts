import { buildAddressLines } from "../../src/features/orders/addressFormat";
import { getOrderCreateErrorMessage, selectPreferredAddress } from "../../src/features/orders/orderReview";
import { generateIdempotencyKey } from "../../src/utils/idempotencyKey";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "8d6e830f-2e8d-4f34-86e3-9f9c8e24b1a2"),
}));

const makeAddress = (overrides: Record<string, unknown> = {}) => ({
  id: "addr-home",
  label: "Home",
  contactName: "Ravi Sharma",
  contactPhone: "+919876543210",
  addressLine1: "Flat 101",
  addressLine2: null,
  city: "Thane",
  state: "Maharashtra",
  postalCode: "400601",
  country: "IN",
  latitude: 19.2183,
  longitude: 72.9781,
  isDefault: true,
  createdAtUtc: "2026-09-15T10:30:00Z",
  updatedAtUtc: "2026-09-15T10:30:00Z",
  ...overrides,
});

function axiosError(status: number, fields: Record<string, unknown> = {}) {
  return { isAxiosError: true, response: { status, data: {} }, ...fields };
}

describe("selectPreferredAddress", () => {
  it("preselects the default address when the customer has multiple addresses", () => {
    const addresses = [makeAddress({ id: "addr-one", isDefault: false }), makeAddress({ id: "addr-two", isDefault: true })];

    expect(selectPreferredAddress(addresses, null)?.id).toBe("addr-two");
  });

  it("uses the single saved address automatically", () => {
    const addresses = [makeAddress({ id: "only", isDefault: false })];

    expect(selectPreferredAddress(addresses, null)?.id).toBe("only");
  });

  it("honours the address chosen on the selection screen", () => {
    const addresses = [makeAddress({ id: "addr-one", isDefault: true }), makeAddress({ id: "addr-two", isDefault: false })];

    expect(selectPreferredAddress(addresses, "addr-two")?.id).toBe("addr-two");
  });

  it("falls back to the default when the chosen address no longer exists", () => {
    const addresses = [makeAddress({ id: "addr-one", isDefault: false }), makeAddress({ id: "addr-two", isDefault: true })];

    expect(selectPreferredAddress(addresses, "stale-address")?.id).toBe("addr-two");
  });

  it("returns null when the customer has no saved addresses", () => {
    expect(selectPreferredAddress([], "addr-one")).toBeNull();
  });
});

describe("getOrderCreateErrorMessage", () => {
  it("guides the user back to the cart on a 409 stale-cart conflict", () => {
    expect(getOrderCreateErrorMessage(axiosError(409))).toBe("Your cart has changed. Please review your cart again.");
  });

  it("explains a missing delivery address on 404", () => {
    expect(getOrderCreateErrorMessage(axiosError(404))).toBe(
      "The delivery address is no longer available. Please choose another address."
    );
  });

  it("asks the user to sign in again on 401", () => {
    expect(getOrderCreateErrorMessage(axiosError(401))).toBe("Your session has expired. Please sign in again.");
  });

  it("shows a retryable network message without exposing internals", () => {
    expect(
      getOrderCreateErrorMessage(axiosError(0, { message: "Network Error", code: "ERR_NETWORK" }))
    ).toBe("Unable to connect to Dharma server. Please check your network connection.");
  });

  it("shows the generic fallback for 5xx responses without leaking details", () => {
    const error = axiosError(500, { response: { status: 500, data: { detail: "secret internal stack" } } });
    expect(getOrderCreateErrorMessage(error)).toBe("We couldn't place your order. Please check the network and try again.");
  });
});

describe("buildAddressLines", () => {
  it("renders every delivery-address field in order and formats the country", () => {
    const lines = buildAddressLines(makeAddress());
    expect(lines).toEqual([
      "Ravi Sharma",
      "+919876543210",
      "Flat 101",
      "Thane",
      "Maharashtra",
      "400601",
      "India",
    ]);
  });

  it("skips empty optional lines", () => {
    const lines = buildAddressLines(makeAddress({ addressLine2: "  " }));
    expect(lines).not.toContain("");
  });
});

describe("generateIdempotencyKey", () => {
  it("returns the cryptographically generated identifier", () => {
    expect(generateIdempotencyKey()).toBe("8d6e830f-2e8d-4f34-86e3-9f9c8e24b1a2");
  });
});