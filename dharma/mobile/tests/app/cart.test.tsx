import React from "react";
import { render } from "@testing-library/react-native";

import CartScreen from "../../app/(protected)/cart";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), replace: jest.fn() },
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
});
