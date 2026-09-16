import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import OrderReviewScreen from "../../app/(protected)/order-review";
import { useAuthStore } from "../../src/auth/store";
import { useOrderReviewStore } from "../../src/features/orders/orderReviewStore";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: (...args: unknown[]) => mockBack(...args),
    dismissTo: (...args: unknown[]) => mockDismissTo(...args),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 10, left: 0 }),
}));

const mockGetCart = jest.fn();
const mockGetAddresses = jest.fn();
const mockCreateOrder = jest.fn();
const mockRandomUUID = jest.fn();

jest.mock("../../src/api/cart", () => ({ getCart: (...args: unknown[]) => mockGetCart(...args) }));
jest.mock("../../src/api/addresses", () => ({ getAddresses: (...args: unknown[]) => mockGetAddresses(...args) }));
jest.mock("../../src/api/orders", () => ({ createOrder: (...args: unknown[]) => mockCreateOrder(...args) }));
jest.mock("expo-crypto", () => ({ randomUUID: (...args: unknown[]) => mockRandomUUID(...args) }));

let queryClient: QueryClient;

const cartFixture = {
  id: "cart-1",
  shopId: "shop-1",
  shopName: "Dharma Store",
  currency: "INR",
  items: [
    { id: "item-1", productId: "product-1", name: "Brass Diya Set", imageUrl: null, quantity: 2, unitPrice: 399, subtotal: 798, available: true },
  ],
  subtotal: 798,
  deliveryCharge: 0,
  serviceCharge: 0,
  total: 798,
  itemCount: 2,
};

const emptyCartFixture = { ...cartFixture, items: [], itemCount: 0, subtotal: 0, total: 0 };

const unavailableCartFixture = {
  ...cartFixture,
  items: [{ id: "item-1", productId: "product-1", name: "Out of Stock Kit", imageUrl: null, quantity: 1, unitPrice: 699, subtotal: 699, available: false }],
  subtotal: 699,
  total: 699,
  itemCount: 1,
};

const homeAddress = {
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
};

const workAddress = { ...homeAddress, id: "addr-work", label: "Work", contactName: "Priya Sharma", isDefault: false };

const createdOrder = {
  id: "order-created-123",
  orderNumber: "DRM-ABC123",
  status: 1,
  subtotal: 798,
  deliveryFee: 0,
  serviceCharge: 0,
  total: 798,
  currency: "INR",
  createdAtUtc: "2026-09-15T10:30:00Z",
};

function seed(cart = cartFixture, addresses = [homeAddress, workAddress], key = "idem-key-1") {
  mockGetCart.mockResolvedValue(cart);
  mockGetAddresses.mockResolvedValue(addresses);
  mockRandomUUID.mockReturnValue(key);
}

function renderReview() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderReviewScreen />
    </QueryClientProvider>
  );
}

function networkError() {
  return { isAxiosError: true, message: "Network Error", code: "ERR_NETWORK" };
}
