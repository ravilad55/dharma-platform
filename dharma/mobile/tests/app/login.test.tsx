import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import LoginScreen from "../../app/(public)/login";
import { useAuthStore } from "../../src/auth/store";
import { router } from "expo-router";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("Dharma Login Screen (Screen #4)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      status: "unauthenticated",
      user: null,
      challenge: null,
      phoneNumber: "",
    });
  });

  it("renders all visual elements from the Dharma design reference", () => {
    const screen = render(<LoginScreen />);

    // Branding & Header
    expect(screen.getByText("DHARMA")).toBeTruthy();
    expect(screen.getByText("Welcome Back!")).toBeTruthy();
    expect(screen.getByText("Login to continue")).toBeTruthy();

    // Fields
    expect(screen.getByText("Mobile Number")).toBeTruthy();
    expect(screen.getByText("+91")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter mobile number")).toBeTruthy();
    expect(screen.getByText("Password")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter your password")).toBeTruthy();

    // Options
    expect(screen.getByText("Remember me")).toBeTruthy();
    expect(screen.getByText("Forgot Password?")).toBeTruthy();

    // CTAs & Divider
    expect(screen.getByText("Login")).toBeTruthy();
    expect(screen.getByText("or")).toBeTruthy();
    expect(screen.getByText("Continue with OTP")).toBeTruthy();

    // Footer
    expect(screen.getByText("Sign Up")).toBeTruthy();
  });

  it("toggles password visibility when eye icon is pressed", () => {
    const screen = render(<LoginScreen />);
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const toggleButton = screen.getByLabelText("Show password");

    // Initially secure
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Toggle to visible
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // Toggle back to hidden
    const hideButton = screen.getByLabelText("Hide password");
    fireEvent.press(hideButton);
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it("toggles the Remember me checkbox", () => {
    const screen = render(<LoginScreen />);
    const checkbox = screen.getByTestId("remember-me-checkbox");

    expect(checkbox.props.accessibilityState.checked).toBe(false);
    fireEvent.press(checkbox);
    expect(checkbox.props.accessibilityState.checked).toBe(true);
  });

  it("validates empty phone number when attempting Continue with OTP", async () => {
    const screen = render(<LoginScreen />);
    const otpButton = screen.getByTestId("otp-button");

    fireEvent.press(otpButton);

    expect(screen.getByText("Please enter your mobile number.")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("validates invalid 5-digit phone number", async () => {
    const screen = render(<LoginScreen />);
    const phoneInput = screen.getByPlaceholderText("Enter mobile number");
    const otpButton = screen.getByTestId("otp-button");

    fireEvent.changeText(phoneInput, "12345");
    fireEvent.press(otpButton);

    expect(screen.getByText("Please enter a valid 10-digit mobile number.")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("successfully requests OTP and navigates to verify-otp with valid phone", async () => {
    const mockRequestOtp = jest.fn().mockResolvedValue({ challengeId: "chal-123" });
    useAuthStore.setState({ requestOtp: mockRequestOtp });

    const screen = render(<LoginScreen />);
    const phoneInput = screen.getByPlaceholderText("Enter mobile number");
    const otpButton = screen.getByTestId("otp-button");

    fireEvent.changeText(phoneInput, "9876543210");
    await act(async () => {
      fireEvent.press(otpButton);
    });

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith("+919876543210", "customer-mobile-device");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/(public)/verify-otp",
        params: { challengeId: "chal-123" },
      });
    });
  });

  it("shows error banner when OTP request fails", async () => {
    const mockRequestOtp = jest.fn().mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: {
          title: "Too many OTP requests. Please wait before trying again.",
          status: 429,
        },
      },
    });
    useAuthStore.setState({ requestOtp: mockRequestOtp });

    const screen = render(<LoginScreen />);
    const phoneInput = screen.getByPlaceholderText("Enter mobile number");
    const otpButton = screen.getByTestId("otp-button");

    fireEvent.changeText(phoneInput, "9876543210");
    await act(async () => {
      fireEvent.press(otpButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Too many OTP requests. Please wait before trying again.")
      ).toBeTruthy();
    });
  });

  it("handles password login button by validating fields and advising OTP flow", () => {
    const screen = render(<LoginScreen />);
    const phoneInput = screen.getByPlaceholderText("Enter mobile number");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const loginButton = screen.getByTestId("login-button");

    // Attempt with empty phone
    fireEvent.press(loginButton);
    expect(screen.getByText("Please enter your mobile number.")).toBeTruthy();

    // Enter valid phone but empty password
    fireEvent.changeText(phoneInput, "9876543210");
    fireEvent.press(loginButton);
    expect(screen.getByText("Please enter your password.")).toBeTruthy();

    // Enter password and press Login
    fireEvent.changeText(passwordInput, "secret123");
    fireEvent.press(loginButton);

    expect(
      screen.getByText(
        'Password authentication is currently not enabled for your account. Please use "Continue with OTP" to log in securely.'
      )
    ).toBeTruthy();
  });

  it("handles Forgot Password action safely", () => {
    const screen = render(<LoginScreen />);
    const forgotButton = screen.getByLabelText("Forgot Password?");

    fireEvent.press(forgotButton);

    expect(
      screen.getByText(
        "Password reset is not enabled. Please sign in using OTP verification."
      )
    ).toBeTruthy();
  });

  it("handles Sign Up link click", () => {
    const screen = render(<LoginScreen />);
    const signUpLink = screen.getByText("Sign Up");

    fireEvent.press(signUpLink);

    expect(
      screen.getByText(
        'New accounts are registered automatically via OTP verification. Enter your mobile number and tap "Continue with OTP".'
      )
    ).toBeTruthy();
  });
});
