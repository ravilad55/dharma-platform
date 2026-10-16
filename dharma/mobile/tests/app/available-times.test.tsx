import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import AvailableTimesScreen from "../../app/(protected)/pandits/available-times";
import { useAuthStore } from "../../src/auth/store";
import { useServiceSelectionStore } from "../../src/features/pandits/serviceSelectionStore";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: (...args: unknown[]) => mockPush(...args) },
  Redirect: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

let mockAvailabilityState: {
  isPending: boolean;
  isError: boolean;
  data?: unknown;
};

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({ ...mockAvailabilityState, refetch: jest.fn() })),
}));

const slots = {
  date: "2030-06-15",
  timezone: "Asia/Kolkata",
  slots: [
    { id: "slot-1", startAt: "2030-06-15T09:00:00+05:30", endAt: "2030-06-15T10:00:00+05:30", status: "Available" },
    { id: "slot-2", startAt: "2030-06-15T11:00:00+05:30", endAt: "2030-06-15T12:00:00+05:30", status: "Booked" },
    { id: "slot-3", startAt: "2030-06-15T14:00:00+05:30", endAt: "2030-06-15T15:00:00+05:30", status: "Available" },
  ],
};

function seedSelection() {
  useServiceSelectionStore.setState({
    selected: { panditId: "p1", panditName: "Pandit Ramesh Sharma", serviceId: "s1", serviceName: "Satyanarayan Puja", price: 999, currency: "INR", durationMinutes: 120 },
    selectedDate: "2030-06-15",
    selectedSlot: null,
  });
}

describe("Available Times screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ status: "authenticated" });
    seedSelection();
    mockAvailabilityState = { isPending: false, isError: false, data: slots };
  });

  it("shows a loading skeleton while times load", () => {
    mockAvailabilityState = { isPending: true, isError: false };
    const screen = render(<AvailableTimesScreen />);
    expect(screen.getByTestId("times-loading")).toBeTruthy();
  });

  it("renders slots with the timezone and status labels", () => {
    const screen = render(<AvailableTimesScreen />);
    expect(screen.getByTestId("times-list")).toBeTruthy();
    expect(screen.getByText("Times shown in Asia/Kolkata")).toBeTruthy();
    expect(screen.getByText("9:00 AM")).toBeTruthy();
    expect(screen.getByText("2:00 PM")).toBeTruthy();
    // Booked slot shows its status and is not selectable.
    expect(screen.getByText("Booked")).toBeTruthy();
  });

  it("only allows selecting Available slots and retains the chosen slot", () => {
    const screen = render(<AvailableTimesScreen />);

    // Tapping a booked slot does nothing (no continue button appears).
    fireEvent.press(screen.getByTestId("slot-slot-2"));
    expect(screen.queryByTestId("time-continue-button")).toBeNull();

    // Tapping an available slot selects it and reveals Continue.
    fireEvent.press(screen.getByTestId("slot-slot-1"));
    const continueButton = screen.getByTestId("time-continue-button");
    expect(continueButton).toBeTruthy();

    fireEvent.press(continueButton);
    expect(mockPush).toHaveBeenCalledWith("/(protected)/pandits/time-selected");
    expect(useServiceSelectionStore.getState().selectedSlot?.slotId).toBe("slot-1");
  });

  it("shows an empty state when there are no available slots", () => {
    mockAvailabilityState = {
      isPending: false,
      isError: false,
      data: { date: "2030-06-15", timezone: "Asia/Kolkata", slots: [{ id: "x", startAt: "2030-06-15T09:00:00+05:30", endAt: "2030-06-15T10:00:00+05:30", status: "Booked" }] },
    };
    const screen = render(<AvailableTimesScreen />);
    expect(screen.getByTestId("times-empty")).toBeTruthy();
  });

  it("shows an error state with retry on failure", () => {
    mockAvailabilityState = { isPending: false, isError: true };
    const screen = render(<AvailableTimesScreen />);
    expect(screen.getByTestId("times-error")).toBeTruthy();
  });

  it("does not render any booking or payment action", () => {
    const screen = render(<AvailableTimesScreen />);
    expect(screen.queryByText("Book Now")).toBeNull();
    expect(screen.queryByText("Pay")).toBeNull();
    expect(screen.queryByText("Confirm Booking")).toBeNull();
  });
});
