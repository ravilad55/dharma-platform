import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import OnboardingScreen1 from "../../app/(onboarding)/onboarding-1";
import OnboardingScreen2 from "../../app/(onboarding)/onboarding-2";
import OnboardingScreen3 from "../../app/(onboarding)/onboarding-3";
import { useAuthStore } from "../../src/auth/store";
import * as storage from "../../src/auth/storage";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

const mockSecureStoreMemory = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStoreMemory.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStoreMemory.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStoreMemory.delete(key);
    return Promise.resolve();
  }),
}));

describe("Dharma Onboarding Experience (Screens 1, 2, 3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      status: "unauthenticated",
      user: null,
      challenge: null,
      phoneNumber: "",
      onboardingCompleted: false,
    });
  });

  describe("Screen 1 — Splash / Onboarding 1", () => {
    it("renders headline, logo, and all 4 horizontal service badges", () => {
      const screen = render(<OnboardingScreen1 />);

      expect(screen.getByText("DHARMA")).toBeTruthy();
      expect(
        screen.getByText(
          "Your one stop for\nSpirituality, Purity\nand Convenience"
        )
      ).toBeTruthy();

      expect(screen.getByText("Pandits")).toBeTruthy();
      expect(screen.getByText("Pooja Samagri")).toBeTruthy();
      expect(screen.getByText("Pure Veg Restaurants")).toBeTruthy();
      expect(screen.getByText("Delivery Services")).toBeTruthy();

      expect(screen.getByText("Get Started")).toBeTruthy();
      expect(screen.getByText("Login")).toBeTruthy();
    });

    it("navigates to Screen 2 when Get Started is pressed", () => {
      const screen = render(<OnboardingScreen1 />);
      const getStartedButton = screen.getByTestId("onboarding-get-started-button");

      fireEvent.press(getStartedButton);
      expect(router.push).toHaveBeenCalledWith("/(onboarding)/onboarding-2");
    });

    it("navigates directly to Login when Login link is pressed", () => {
      const screen = render(<OnboardingScreen1 />);
      const loginLink = screen.getByTestId("onboarding-login-link");

      fireEvent.press(loginLink);
      expect(router.push).toHaveBeenCalledWith("/(public)/login");
    });
  });

  describe("Screen 2 — Splash / Onboarding 2", () => {
    it("renders heading, 4 feature rows, temple illustration, and pagination dot 2", () => {
      const screen = render(<OnboardingScreen2 />);

      expect(
        screen.getByText("Everything you need\nin one place")
      ).toBeTruthy();

      // Row 1
      expect(screen.getByText("Trusted Pandits")).toBeTruthy();
      expect(screen.getByText("Verified & experienced")).toBeTruthy();

      // Row 2
      expect(screen.getByText("Pooja Samagri")).toBeTruthy();
      expect(screen.getByText("Pure & authentic items")).toBeTruthy();

      // Row 3
      expect(screen.getByText("Pure Veg Restaurants")).toBeTruthy();
      expect(screen.getByText("Nearby pure veg food")).toBeTruthy();

      // Row 4
      expect(screen.getByText("Delivery Services")).toBeTruthy();
      expect(screen.getByText("Fast & reliable delivery")).toBeTruthy();

      // Pagination
      expect(screen.getByLabelText("Step 2 of 3")).toBeTruthy();
      expect(screen.getByText("Next")).toBeTruthy();
    });

    it("navigates to Screen 3 when Next is pressed", () => {
      const screen = render(<OnboardingScreen2 />);
      const nextButton = screen.getByTestId("onboarding-next-button");

      fireEvent.press(nextButton);
      expect(router.push).toHaveBeenCalledWith("/(onboarding)/onboarding-3");
    });
  });

  describe("Screen 3 — Splash / Onboarding 3", () => {
    it("renders spiritual journey heading, 4 trust pillars, and pagination dot 3", () => {
      const screen = render(<OnboardingScreen3 />);

      expect(
        screen.getByText("Made for your\nspiritual journey")
      ).toBeTruthy();

      expect(screen.getByText("Easy Booking")).toBeTruthy();
      expect(screen.getByText("Secure Payments")).toBeTruthy();
      expect(screen.getByText("Live Tracking")).toBeTruthy();
      expect(screen.getByText("24/7 Support")).toBeTruthy();

      expect(screen.getByLabelText("Step 3 of 3")).toBeTruthy();
      expect(screen.getByText("Get Started")).toBeTruthy();
    });

    it("persists onboarding completion and navigates to Login when Get Started is pressed", async () => {
      const setCompletedSpy = jest.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ setOnboardingCompleted: setCompletedSpy });

      const screen = render(<OnboardingScreen3 />);
      const finishButton = screen.getByTestId("onboarding-finish-button");

      await act(async () => {
        fireEvent.press(finishButton);
      });

      await waitFor(() => {
        expect(setCompletedSpy).toHaveBeenCalledWith(true);
        expect(router.replace).toHaveBeenCalledWith("/(public)/login");
      });
    });
  });

  describe("Onboarding Storage Persistence", () => {
    it("reads and writes onboarding completion in secure storage", async () => {
      await storage.writeOnboardingCompleted(true);
      const isCompleted = await storage.readOnboardingCompleted();
      expect(isCompleted).toBe(true);

      await storage.clearOnboardingCompleted();
      const afterClear = await storage.readOnboardingCompleted();
      expect(afterClear).toBe(false);
    });
  });
});
