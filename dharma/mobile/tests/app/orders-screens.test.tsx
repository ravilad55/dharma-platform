import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import OrdersScreen from "../../app/(protected)/orders/index";
import OrderDetailsScreen from "../../app/(protected)/orders/[orderId]";
import { useAuthStore } from "../../src/auth/store";

const mockUseInfiniteQuery = jest.fn();
const mockUseQuery = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockRouteParams: { orderId?: string | string[] } = { orderId: "order-1" };

jest.mock("expo-router", () => ({
  Redirect: () => null,
  router: { back: (...args: unknown[]) => mockBack(...args), push: (...args: unknown[]) => mockPush(...args), replace: (...args: unknown[]) => mockReplace(...args) },
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 24, left: 0 }),
}));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  };
});

function renderWithClient(node: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const orderSummary = {
  id: "order-1",
  orderNumber: "DHM-20260915-0001",
  status: 1,
  subtotal: 798,
  deliveryCharge: 0,
  serviceCharge: 0,
  total: 798,
  currency: "INR",
  createdAtUtc: "2026-09-15T10:30:00Z",
};

const orderDetails = {
  ...orderSummary,
  updatedAtUtc: "2026-09-15T10:31:00Z",
  items: [
    {
      productId: "product-1",
      productName: "Brass Diya Set",
      sku: "DIY-BR-001",
      quantity: 2,
      unitPrice: 399,
      taxAmount: 0,
      discountAmount: 0,
      lineTotal: 798,
      currency: "INR",
    },
  ],
  address: {
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
  },
};

function infiniteState(overrides: Record<string, unknown> = {}) {
  return {
    isPending: false,
    isError: false,
    error: undefined,
    data: undefined,
    hasNextPage: false,
    isFetchingNextPage: false,
    isRefetching: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  };
}

describe("Orders screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { orderId: "order-1" };
    mockUseQuery.mockReturnValue({ isPending: true, isError: false, data: undefined });
    mockUseInfiniteQuery.mockReturnValue(infiniteState());
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "user-1", displayName: "Ravi", scope: "CUSTOMER", sessionId: "sess-1" },
      challenge: null,
      phoneNumber: "+919876543210",
    });
  });

  it("shows skeleton cards while orders load", () => {
    mockUseInfiniteQuery.mockReturnValue(infiniteState({ isPending: true }));

    const screen = renderWithClient(<OrdersScreen />);

    expect(screen.getByTestId("orders-loading")).toBeTruthy();
    expect(screen.getByText("My Orders")).toBeTruthy();
  });

  it("displays server orders with status and totals", () => {
    mockUseInfiniteQuery.mockReturnValue(
      infiniteState({ data: { pages: [{ items: [orderSummary], page: 1, pageSize: 20, totalCount: 1 }] } })
    );

    const screen = renderWithClient(<OrdersScreen />);

    expect(screen.getByText("Order #DHM-20260915-0001")).toBeTruthy();
    expect(screen.getByText("15 Sep 2026")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByText("₹798.00")).toBeTruthy();
  });

  it("navigates to order details when an order card is pressed", () => {
    mockUseInfiniteQuery.mockReturnValue(
      infiniteState({ data: { pages: [{ items: [orderSummary], page: 1, pageSize: 20, totalCount: 1 }] } })
    );

    const screen = renderWithClient(<OrdersScreen />);
    fireEvent.press(screen.getByTestId("order-card-order-1"));

    expect(mockPush).toHaveBeenCalledWith("/(protected)/orders/order-1");
  });

  it("shows the empty state with the samagri CTA", () => {
    mockUseInfiniteQuery.mockReturnValue(
      infiniteState({ data: { pages: [{ items: [], page: 1, pageSize: 20, totalCount: 0 }] } })
    );

    const screen = renderWithClient(<OrdersScreen />);

    expect(screen.getByTestId("orders-empty")).toBeTruthy();
    expect(screen.getByText("No orders yet")).toBeTruthy();

    fireEvent.press(screen.getByText("Explore Pooja Samagri"));
    expect(mockReplace).toHaveBeenCalledWith("/(protected)/samagri");
  });

  it("shows the error state with retry", () => {
    const refetch = jest.fn();
    mockUseInfiniteQuery.mockReturnValue(
      infiniteState({ isError: true, error: new Error("Network Error"), refetch })
    );

    const screen = renderWithClient(<OrdersScreen />);
    expect(screen.getByTestId("orders-error")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Try Again"));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows skeleton rows while order details load", () => {
    mockUseQuery.mockReturnValue({ isPending: true, isError: false, data: undefined });

    const screen = renderWithClient(<OrderDetailsScreen />);

    expect(screen.getByTestId("order-loading")).toBeTruthy();
    expect(screen.getByText("Order Details")).toBeTruthy();
  });

  it("displays snapshots and server totals without recalculating", () => {
    mockUseQuery.mockReturnValue({ isPending: false, isError: false, data: orderDetails, refetch: jest.fn() });

    const screen = renderWithClient(<OrderDetailsScreen />);

    expect(screen.getByText("Order #DHM-20260915-0001")).toBeTruthy();
    expect(screen.getByText("Brass Diya Set")).toBeTruthy();
    expect(screen.getByText("DIY-BR-001")).toBeTruthy();
    expect(screen.getByText("Qty 2 × ₹399.00")).toBeTruthy();
    expect(screen.getByText("Delivery Address")).toBeTruthy();
    expect(screen.getByText("Ravi Sharma")).toBeTruthy();
    expect(screen.getByText("Thane")).toBeTruthy();
    expect(screen.getByText("Price Summary")).toBeTruthy();
    expect(screen.getAllByText("₹798.00").length).toBeGreaterThanOrEqual(2);
  });

  it("renders an unknown future status safely", () => {
    mockUseQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...orderDetails, status: 99 },
      refetch: jest.fn(),
    });

    const screen = renderWithClient(<OrderDetailsScreen />);
    expect(screen.getByText("Status unavailable")).toBeTruthy();
  });

  it("shows a user-friendly 404 for missing orders", () => {
    const notFound = { isAxiosError: true, response: { status: 404, data: {} } };
    mockUseQuery.mockReturnValue({ isPending: false, isError: true, error: notFound, refetch: jest.fn() });

    const screen = renderWithClient(<OrderDetailsScreen />);
    expect(screen.getByText("Order not found")).toBeTruthy();
    expect(screen.queryByText("404")).toBeNull();
  });
});
