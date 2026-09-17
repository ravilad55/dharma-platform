import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import HomeScreen from "../../app/(protected)/home";
import { useAuthStore } from "../../src/auth/store";

let mockRedirectHref: string | null = null;

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  Redirect: ({ href }: { href: string }) => {
    mockRedirectHref = href;
    return null;
  },
}));

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("Dharma Customer Home Screen (Screen #8)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirectHref = null;
    useAuthStore.setState({
      status: "authenticated",
      user: {
        id: "usr-444",
        displayName: "Ravi Sharma",
        scope: "CUSTOMER",
        sessionId: "sess-888",
      },
      challenge: null,
      phoneNumber: "+919876543210",
    });
  });

  it("renders location selector with default Thane location and notification badge", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("Thane, Maharashtra")).toBeTruthy();
    expect(screen.getByLabelText("Notifications, 2 unread")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("renders personalized greeting with authenticated user displayName", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("Namaste, Ravi Sharma 🙏")).toBeTruthy();
    expect(screen.getByText("What would you like to do today?")).toBeTruthy();
  });

  it("renders safe fallback 'Devotee' when user displayName is unavailable", () => {
    useAuthStore.setState({
      user: {
        id: "usr-555",
        displayName: null,
        scope: "CUSTOMER",
        sessionId: "sess-999",
      },
    });

    const screen = render(<HomeScreen />);

    expect(screen.getByText("Namaste, Devotee 🙏")).toBeTruthy();
  });

  it("does NOT display internal debug details (Account Scope, User ID, Session ID)", () => {
    const screen = render(<HomeScreen />);

    expect(screen.queryByText("Account Scope")).toBeNull();
    expect(screen.queryByText("User ID")).toBeNull();
    expect(screen.queryByText("Session ID")).toBeNull();
  });

  it("renders search bar with search placeholder and voice search mic icon", () => {
    const screen = render(<HomeScreen />);

    const searchInput = screen.getByPlaceholderText("Search Dharma...");
    expect(searchInput).toBeTruthy();
    expect(screen.getByLabelText("Voice search")).toBeTruthy();

    fireEvent.changeText(searchInput, "Satyanarayan");
    expect(searchInput.props.value).toBe("Satyanarayan");
  });

  it("renders Explore Services with View All and all 4 service cards", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("View All")).toBeTruthy();
    expect(screen.getByText("Pandits")).toBeTruthy();
    expect(screen.getByText("Pooja Samagri")).toBeTruthy();
    expect(screen.getByText("Pure Veg Restaurants")).toBeTruthy();
    expect(screen.getByText("Delivery Services")).toBeTruthy();
  });

  it("handles clicking on individual service cards", () => {
    const screen = render(<HomeScreen />);

    const panditsCard = screen.getByTestId("service-card-pandits");
    fireEvent.press(panditsCard);

    const samagriCard = screen.getByTestId("service-card-samagri");
    fireEvent.press(samagriCard);

    const restaurantsCard = screen.getByTestId("service-card-restaurants");
    fireEvent.press(restaurantsCard);

    const deliveryCard = screen.getByTestId("service-card-delivery");
    fireEvent.press(deliveryCard);
  });

  it("renders Upcoming Booking section with empty state when no active booking", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("Upcoming Booking")).toBeTruthy();
    expect(screen.getByText("No upcoming bookings")).toBeTruthy();
    expect(
      screen.getByText("Explore services to make your first sacred booking")
    ).toBeTruthy();

    const exploreBtn = screen.getByTestId("explore-first-booking-button");
    fireEvent.press(exploreBtn);
  });

  it("renders 5 bottom navigation tabs with Home initially selected", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByTestId("tab-home")).toBeTruthy();
    expect(screen.getByTestId("tab-bookings")).toBeTruthy();
    expect(screen.getByTestId("tab-orders")).toBeTruthy();
    expect(screen.getByTestId("tab-notifications")).toBeTruthy();
    expect(screen.getByTestId("tab-profile")).toBeTruthy();

    const homeTab = screen.getByTestId("tab-home");
    expect(homeTab.props.accessibilityState.selected).toBe(true);

    const bookingsTab = screen.getByTestId("tab-bookings");
    expect(bookingsTab.props.accessibilityState.selected).toBe(false);

    // Press another tab
    fireEvent.press(bookingsTab);
    expect(bookingsTab.props.accessibilityState.selected).toBe(true);
  });

  it("handles logout when profile tab is pressed", async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ logout: mockLogout });

    const screen = render(<HomeScreen />);
    const profileTab = screen.getByTestId("tab-profile");

    await act(async () => {
      fireEvent.press(profileTab);
    });

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it("redirects to login when user is unauthenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });
    render(<HomeScreen />);

    expect(mockRedirectHref).toBe("/(public)/login");
  });
});
