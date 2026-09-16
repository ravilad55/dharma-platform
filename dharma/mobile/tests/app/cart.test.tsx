import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import CartScreen from "../../app/(protected)/cart";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => ({ setQueryData: jest.fn() })),
  useMutation: jest.fn(() => ({ isPending: false, isError: false, mutate: jest.fn() })),
  useQuery: jest.fn(() => ({
    data: {
      id: "cart-1",
      shopId: "shop-1",
      shopName: "Dharma Store",
      currency: "INR",
      items: [{ id: "item-1", productId: "product-1", name: "Griha Pravesh Kit", quantity: 2, unitPrice: 699, subtotal: 1398, available: true }],
      subtotal: 1398,
      deliveryCharge: 0,
      serviceCharge: 0,
      total: 1398,
      itemCount: 2,
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
}));

describe("Cart screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders server-derived item and price summary", () => {
    const screen = render(<CartScreen />);

    expect(screen.getByText("My Cart")).toBeTruthy();
    expect(screen.getByText("Pooja Samagri Shop")).toBeTruthy();
    expect(screen.getByText("Griha Pravesh Kit")).toBeTruthy();
    expect(screen.getAllByText("₹1,398").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText("Increase Griha Pravesh Kit")).toBeTruthy();
    expect(screen.getByLabelText("Remove Griha Pravesh Kit")).toBeTruthy();
    expect(screen.getByLabelText("Continue")).toBeTruthy();
  });

  it("navigates to order review when Continue is pressed", () => {
    const screen = render(<CartScreen />);

    fireEvent.press(screen.getByLabelText("Continue"));

    expect(mockPush).toHaveBeenCalledWith("/(protected)/order-review");
  });

  it("blocks Continue while the cart contains unavailable items", () => {
    jest.mocked(require("@tanstack/react-query").useQuery).mockReturnValueOnce({
      data: {
        id: "cart-1",
        shopId: "shop-1",
        shopName: "Dharma Store",
        currency: "INR",
        items: [{ id: "item-1", productId: "product-1", name: "Out of Stock Kit", quantity: 1, unitPrice: 699, subtotal: 699, available: false }],
        subtotal: 699,
        deliveryCharge: 0,
        serviceCharge: 0,
        total: 699,
        itemCount: 1,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const screen = render(<CartScreen />);

    const continueButton = screen.getByLabelText("Continue");
    expect(continueButton.props.disabled).toBe(true);
    expect(screen.getByText("Remove unavailable items")).toBeTruthy();
  });
});
