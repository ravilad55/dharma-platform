import api from "../../src/api/client";
import { getOrder, getOrders } from "../../src/api/orders";

jest.mock("../../src/api/client", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = api.get as jest.Mock;

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
});
