import React from "react";
import { render } from "@testing-library/react-native";

import Index from "../../app/index";
import { useAuthStore } from "../../src/auth/store";

let mockRedirectHref: string | null = null;

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
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

describe("App Root Index & Bootstrap", () => {
  const mockBootstrap = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirectHref = null;
    useAuthStore.setState({
      status: "bootstrapping",
      user: null,
      challenge: null,
      phoneNumber: "",
      onboardingCompleted: false,
      bootstrap: mockBootstrap,
    });
  });

  it("renders the Dharma splash and loading indicator during bootstrapping", () => {
    const screen = render(<Index />);

    expect(screen.getByText("DHARMA")).toBeTruthy();
    expect(screen.getByLabelText("Restoring session")).toBeTruthy();
  });

  it("Case A: redirects to Onboarding Screen 1 on first install (unauthenticated & onboarding incomplete)", () => {
    useAuthStore.setState({
      status: "unauthenticated",
      onboardingCompleted: false,
    });
    render(<Index />);

    expect(mockRedirectHref).toBe("/(onboarding)/onboarding-1");
  });

  it("Case B: redirects to Login when unauthenticated with completed onboarding", () => {
    useAuthStore.setState({
      status: "unauthenticated",
      onboardingCompleted: true,
    });
    render(<Index />);

    expect(mockRedirectHref).toBe("/(public)/login");
  });

  it("Case C: redirects to Protected Home when authenticated (regardless of onboarding flag)", () => {
    useAuthStore.setState({
      status: "authenticated",
      onboardingCompleted: true,
      user: {
        id: "u-1",
        displayName: "Test User",
        scope: "CUSTOMER",
        sessionId: "s-1",
      },
    });
    render(<Index />);

    expect(mockRedirectHref).toBe("/(protected)/home");
  });
});
