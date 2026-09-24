import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import HomeScreen from "../../app/(protected)/home";
import { useAuthStore } from "../../src/auth/store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn() },
  Redirect: () => null,
}));

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("Home Pandits navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "usr-1", displayName: "Ravi", scope: "CUSTOMER", sessionId: "sess-1" },
      challenge: null,
      phoneNumber: "+919876543210",
    });
  });

  it("navigates to the Pandit discovery screen when the Pandits card is pressed", () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("service-card-pandits"));
    expect(mockPush).toHaveBeenCalledWith("/(protected)/pandits");
  });

  it("still navigates to Pooja Samagri (existing behaviour is preserved)", () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("service-card-samagri"));
    expect(mockPush).toHaveBeenCalledWith("/(protected)/samagri");
  });
});
