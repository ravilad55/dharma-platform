import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import PanditsScreen from "../../app/(protected)/pandits/index";
import { getNextPanditsPageParam, panditFilters, serviceParamForFilter } from "../../src/features/pandits/panditFilters";
import { useAuthStore } from "../../src/auth/store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: (...args: unknown[]) => mockPush(...args) },
  Redirect: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Bundled SVGs are not transformed under jest-expo; fall back to the placeholder avatar in tests.
jest.mock("../../src/features/pandits/panditImages", () => ({
  getLocalPanditImage: jest.fn(() => undefined),
}));

const samplePandit = {
  id: "pandit-1",
  displayName: "Pandit Ramesh Sharma",
  imageUrl: "pandits/pandit-ramesh.png",
  shortDescription: "Vedic scholar.",
  experienceYears: 18,
  city: "Thane",
  state: "Maharashtra",
  languages: ["Marathi", "Hindi", "Sanskrit"],
  rating: 4.8,
  reviewCount: 214,
  isAvailable: true,
  primaryServiceName: "Satyanarayan Puja",
  startingPrice: 999,
  currency: "INR",
};

let mockQueryState: {
  isPending: boolean;
  isError: boolean;
  data?: { pages: { items: (typeof samplePandit)[]; page: number; pageSize: number; totalCount: number }[] };
};

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(() => ({
    ...mockQueryState,
    error: mockQueryState.isError ? new Error("boom") : null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
  })),
}));

function setAuthenticated() {
  useAuthStore.setState({ status: "authenticated" });
}

describe("Pandit list screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthenticated();
    mockQueryState = {
      isPending: false,
      isError: false,
      data: { pages: [{ items: [samplePandit], page: 1, pageSize: 20, totalCount: 1 }] },
    };
  });

  it("shows a loading skeleton while pandits load", () => {
    mockQueryState = { isPending: true, isError: false };
    const screen = render(<PanditsScreen />);
    expect(screen.getByTestId("pandits-loading")).toBeTruthy();
  });

  it("renders a pandit card on success with discovery details", () => {
    const screen = render(<PanditsScreen />);
    expect(screen.getByText("Pandits")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search Pandits or services...")).toBeTruthy();
    expect(screen.getByTestId("pandit-card-pandit-1")).toBeTruthy();
    expect(screen.getByText("Pandit Ramesh Sharma")).toBeTruthy();
    expect(screen.getByText("18 years experience")).toBeTruthy();
    expect(screen.getByText("Thane, Maharashtra")).toBeTruthy();
    expect(screen.getByText("Marathi • Hindi • Sanskrit")).toBeTruthy();
    expect(screen.getByText("⭐ 4.8")).toBeTruthy();
    expect(screen.getByText("(214)")).toBeTruthy();
    expect(screen.getByText("Available")).toBeTruthy();
    expect(screen.getByText("Satyanarayan Puja")).toBeTruthy();
    expect(screen.getByText("From ₹999.00")).toBeTruthy();
  });

  it("does NOT render a Book Now action (booking is a later slice)", () => {
    const screen = render(<PanditsScreen />);
    expect(screen.queryByText("Book Now")).toBeNull();
    expect(screen.getByText("View Profile")).toBeTruthy();
  });

  it("navigates to the pandit profile when View Profile is pressed", () => {
    const screen = render(<PanditsScreen />);
    fireEvent.press(screen.getByTestId("view-profile-pandit-1"));
    expect(mockPush).toHaveBeenCalledWith("/(protected)/pandits/pandit-1");
  });

  it("renders the empty state with Clear Filters when a search yields nothing", () => {
    mockQueryState = { isPending: false, isError: false, data: { pages: [{ items: [], page: 1, pageSize: 20, totalCount: 0 }] } };
    const screen = render(<PanditsScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Search Pandits or services..."), "zzz");
    expect(screen.getByTestId("pandits-empty")).toBeTruthy();
    expect(screen.getByText("No Pandits found")).toBeTruthy();
    expect(screen.getByText("Clear Filters")).toBeTruthy();
  });

  it("renders an error state with retry when loading fails", () => {
    mockQueryState = { isPending: false, isError: true };
    const screen = render(<PanditsScreen />);
    expect(screen.getByTestId("pandits-error")).toBeTruthy();
    expect(screen.getByText("Unable to load pandits")).toBeTruthy();
  });

  it("supports search input and filter chips", () => {
    const screen = render(<PanditsScreen />);
    const searchInput = screen.getByPlaceholderText("Search Pandits or services...");
    fireEvent.changeText(searchInput, "Ganesh");
    expect(searchInput.props.value).toBe("Ganesh");

    const wedding = screen.getByTestId("pandit-filter-wedding");
    fireEvent.press(wedding);
    expect(wedding.props.accessibilityState.selected).toBe(true);
  });
});

describe("Pandit discovery helpers", () => {
  it("derives the next page only when more pandits remain", () => {
    expect(getNextPanditsPageParam({ page: 1, pageSize: 20, totalCount: 45 })).toBe(2);
    expect(getNextPanditsPageParam({ page: 3, pageSize: 20, totalCount: 45 })).toBeUndefined();
  });

  it("maps filter chips to server service parameters without hard-coding results", () => {
    expect(serviceParamForFilter("all")).toBeUndefined();
    expect(serviceParamForFilter("wedding")).toBe("Wedding");
    expect(serviceParamForFilter("griha-pravesh")).toBe("Griha Pravesh");
    expect(serviceParamForFilter("other")).toBeUndefined();
    expect(panditFilters[0].id).toBe("all");
  });
});
