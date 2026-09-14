import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import SamagriScreen from "../../app/(protected)/samagri";
import { getLocalProductImage } from "../../src/features/samagri/productImages";

jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../../src/api/catalog", () => ({
  getCategories: jest.fn().mockResolvedValue([
    { id: "kits", name: "Kits", sortOrder: 1 },
    { id: "diyas", name: "Diyas", sortOrder: 2 },
    { id: "flowers", name: "Flowers", sortOrder: 3 },
    { id: "incense", name: "Incense", sortOrder: 4 },
    { id: "more", name: "More", sortOrder: 5 },
  ]),
  getProducts: jest.fn().mockResolvedValue({
    items: [{
      id: "kit-1",
      name: "Griha Pravesh Kit",
      shortDescription: "Everything you need for your new home ceremony.",
      price: 699,
      currency: "INR",
      imageUrl: "https://example.com/kit.jpg",
      category: { id: "kits", name: "Kits", sortOrder: 1 },
      isAvailable: true,
      shopName: "Dharma Store",
    }],
    page: 1,
    pageSize: 20,
    totalCount: 1,
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(({ queryKey }: { queryKey: string[] }) => queryKey[0] === "product-categories"
    ? { data: [
      { id: "kits", name: "Kits", sortOrder: 1 },
      { id: "diyas", name: "Diyas", sortOrder: 2 },
      { id: "flowers", name: "Flowers", sortOrder: 3 },
      { id: "incense", name: "Incense", sortOrder: 4 },
      { id: "more", name: "More", sortOrder: 5 },
    ], isLoading: false, isError: false }
    : { data: { items: [{
      id: "kit-1",
      name: "Griha Pravesh Kit",
      shortDescription: "Everything you need for your new home ceremony.",
      price: 699,
      currency: "INR",
      imageUrl: "https://example.com/kit.jpg",
      category: { id: "kits", name: "Kits", sortOrder: 1 },
      isAvailable: true,
      shopName: "Dharma Store",
    }] }, isLoading: false, isError: false, refetch: jest.fn() }),
}));

describe("Pooja Samagri screen", () => {
  it("resolves seeded catalog image references to bundled artwork", () => {
    expect(getLocalProductImage("catalog/griha-pravesh-kit.png")).toBeTruthy();
    expect(getLocalProductImage("catalog/sandalwood-incense.png")).toBeTruthy();
    expect(getLocalProductImage("catalog/unknown.png")).toBeUndefined();
  });

  it("keeps the catalog structure and local cart visible", () => {
    const screen = render(<SamagriScreen />);

    expect(screen.getByText("Pooja Samagri")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search items...")).toBeTruthy();
    expect(screen.getByText("Kits")).toBeTruthy();
    expect(screen.getByText("Diyas")).toBeTruthy();
    expect(screen.getByText("Flowers")).toBeTruthy();
    expect(screen.getByText("Incense")).toBeTruthy();
    expect(screen.getByText("More")).toBeTruthy();
    expect(screen.getByText("Popular Kits")).toBeTruthy();

    expect(screen.getByText("Griha Pravesh Kit")).toBeTruthy();
    expect(screen.getByText("Everything you need for your new home ceremony.")).toBeTruthy();
    expect(screen.getByText("₹699")).toBeTruthy();
    expect(screen.getByText("In Stock")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Add Griha Pravesh Kit"));

    expect(screen.getByText(/1 Item/)).toBeTruthy();
    expect(screen.getByText(/₹699/)).toBeTruthy();
    expect(screen.getByLabelText("Cart, 1 items")).toBeTruthy();
    expect(screen.getByLabelText("View cart")).toBeTruthy();
  });
});