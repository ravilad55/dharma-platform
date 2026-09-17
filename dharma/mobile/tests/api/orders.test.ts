import api from "../../src/api/client";
import { createOrder, getOrder, getOrders } from "../../src/api/orders";

jest.mock("../../src/api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = api.get as jest.Mock;
const mockedPost = api.post as jest.Mock;

describe("Orders API client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests the paged customer orders endpoint", async () => {
    const payload = { items: [], page: 1, pageSize: 20, totalCount: 0 };
    mockedGet.mockResolvedValueOnce({ data: payload });

    await expect(getOrders({ page: 1, pageSize: 20 })).resolves.toEqual(payload);
    expect(mockedGet).toHaveBeenCalledWith("/orders", { params: { page: 1, pageSize: 20 } });
  });

  it("requests a single customer order without extra parameters", async () => {
    const payload = { id: "order-1", orderNumber: "DHM-1", items: [], address: {} };
    mockedGet.mockResolvedValueOnce({ data: payload });

    await expect(getOrder("order-1")).resolves.toEqual(payload);
    expect(mockedGet).toHaveBeenCalledWith("/orders/order-1");
  });

  it("sends only the selected addressId with an Idempotency-Key header when creating an order", async () => {
    const payload = {
      id: "order-created-1",
      orderNumber: "DRM-ABC",
      status: 1,
      subtotal: 798,
      deliveryFee: 0,
      serviceCharge: 0,
      total: 798,
      currency: "INR",
      createdAtUtc: "2026-09-15T10:30:00Z",
    };
    mockedPost.mockResolvedValueOnce({ data: payload });

    await expect(createOrder({ addressId: "addr-1" }, "idem-key-abc")).resolves.toEqual(payload);
    expect(mockedPost).toHaveBeenCalledWith(
      "/orders",
      { addressId: "addr-1" },
      { headers: { "Idempotency-Key": "idem-key-abc" } }
    );
  });
});
