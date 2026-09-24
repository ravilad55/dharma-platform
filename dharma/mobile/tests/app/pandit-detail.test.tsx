import React from "react";
import { render } from "@testing-library/react-native";

import PanditDetailScreen from "../../app/(protected)/pandits/[panditId]";
import { useAuthStore } from "../../src/auth/store";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  Redirect: () => null,
  useLocalSearchParams: () => ({ panditId: "pandit-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Bundled SVGs are not transformed under jest-expo; fall back to the placeholder avatar in tests.
jest.mock("../../src/features/pandits/panditImages", () => ({
  getLocalPanditImage: jest.fn(() => undefined),
}));

let mockQueryState: {
  isPending: boolean;
  isError: boolean;
  data?: unknown;
  error?: unknown;
};

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({
    ...mockQueryState,
    refetch: jest.fn(),
  })),
}));

const panditDetail = {
  id: "pandit-1",
  displayName: "Pandit Ramesh Sharma",
  imageUrl: "pandits/pandit-ramesh.png",
  description: "Vedic scholar specialising in home ceremonies.",
  experienceYears: 18,
  city: "Thane",
  state: "Maharashtra",
  languages: ["Marathi", "Hindi", "Sanskrit"],
  rating: 4.8,
  reviewCount: 214,
  isAvailable: true,
  services: [
    { id: "svc-1", name: "Satyanarayan Puja", description: "Complete Satyanarayan Puja ceremony", durationMinutes: 120, price: 999, currency: "INR" },
  ],
};

describe("Pandit detail screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ status: "authenticated" });
    mockQueryState = { isPending: false, isError: false, data: panditDetail };
  });

  it("shows a loading skeleton while the profile loads", () => {
    mockQueryState = { isPending: true, isError: false };
    const screen = render(<PanditDetailScreen />);
    expect(screen.getByTestId("pandit-detail-loading")).toBeTruthy();
  });

  it("renders the pandit profile and services on success", () => {
    const screen = render(<PanditDetailScreen />);
    expect(screen.getAllByText("Pandit Ramesh Sharma").length).toBeGreaterThan(0);
    expect(screen.getByText("⭐ 4.8")).toBeTruthy();
    expect(screen.getByText("(214 reviews)")).toBeTruthy();
    expect(screen.getByText("18 years experience")).toBeTruthy();
    expect(screen.getByText("Thane, Maharashtra")).toBeTruthy();
    expect(screen.getByText("Marathi • Hindi • Sanskrit")).toBeTruthy();
    expect(screen.getByText("Services")).toBeTruthy();
    expect(screen.getByTestId("service-card-svc-1")).toBeTruthy();
    expect(screen.getByText("Satyanarayan Puja")).toBeTruthy();
    expect(screen.getByText("Complete Satyanarayan Puja ceremony")).toBeTruthy();
    expect(screen.getByText("Duration: 2 hrs")).toBeTruthy();
    expect(screen.getByText("From ₹999.00")).toBeTruthy();
  });

  it("shows the next-slice booking note and NO booking action", () => {
    const screen = render(<PanditDetailScreen />);
    expect(screen.getByTestId("booking-next-slice-note")).toBeTruthy();
    expect(screen.getByText("Booking will be available in the next slice.")).toBeTruthy();
    expect(screen.queryByText("Book Now")).toBeNull();
    expect(screen.queryByText("Book")).toBeNull();
  });

  it("renders a not-found state for an unknown pandit (404)", () => {
    const notFound = { isAxiosError: true, response: { status: 404 } };
    mockQueryState = { isPending: false, isError: true, error: notFound };
    const screen = render(<PanditDetailScreen />);
    expect(screen.getByTestId("pandit-detail-not-found")).toBeTruthy();
    expect(screen.getByText("Pandit not found")).toBeTruthy();
  });

  it("renders an error state with retry on a non-404 failure", () => {
    const failure = { isAxiosError: true, response: { status: 500 } };
    mockQueryState = { isPending: false, isError: true, error: failure };
    const screen = render(<PanditDetailScreen />);
    expect(screen.getByTestId("pandit-detail-error")).toBeTruthy();
    expect(screen.getByText("Unable to load profile")).toBeTruthy();
  });
});
