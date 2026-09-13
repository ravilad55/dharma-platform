import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import VerifyOtpScreen from "../../app/(public)/verify-otp";
import { useAuthStore } from "../../src/auth/store";
import { router } from "expo-router";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  Redirect: ({ href }: { href: string }) => {
    return null;
  },
}));

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("Verify OTP Screen", () => {
  const mockChallenge = {
    challengeId: "chal-999",
    maskedPhone: "+919******10",
    expiresAtUtc: "2026-01-01T00:05:00Z",
    resendAvailableAtUtc: "2026-01-01T00:00:30Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      status: "unauthenticated",
      user: null,
      challenge: mockChallenge,
      phoneNumber: "+919876543210",
    });
  });

  it("renders the verification screen with masked phone number and 6-digit input", () => {
    const screen = render(<VerifyOtpScreen />);

    expect(screen.getByText("DHARMA")).toBeTruthy();
    expect(screen.getByText("Verify Phone")).toBeTruthy();
    expect(screen.getByText("+919******10")).toBeTruthy();
    expect(screen.getByText("Verify")).toBeTruthy();
    expect(screen.getByText("← Change mobile number")).toBeTruthy();
  });

  it("disables the Verify button when fewer than 6 digits are entered", () => {
    const screen = render(<VerifyOtpScreen />);
    const otpInput = screen.getByLabelText("6-digit verification code");
    const verifyButton = screen.getByTestId("verify-submit-button");

    expect(verifyButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(otpInput, "1234");
    expect(verifyButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(otpInput, "123456");
    expect(verifyButton.props.accessibilityState.disabled).toBe(false);
  });

  it("successfully verifies OTP and navigates to protected home", async () => {
    const mockVerify = jest.fn().mockResolvedValueOnce(undefined);
    useAuthStore.setState({ verifyOtp: mockVerify });

    const screen = render(<VerifyOtpScreen />);
    const otpInput = screen.getByLabelText("6-digit verification code");
    const verifyButton = screen.getByTestId("verify-submit-button");

    fireEvent.changeText(otpInput, "123456");

    await act(async () => {
      fireEvent.press(verifyButton);
    });

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith("123456", "customer-mobile-device");
      expect(router.replace).toHaveBeenCalledWith("/(protected)/home");
    });
  });

  it("displays error banner when verification fails with invalid OTP", async () => {
    const mockVerify = jest.fn().mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          title: "The verification code is invalid.",
          status: 401,
        },
      },
    });
    useAuthStore.setState({ verifyOtp: mockVerify });

    const screen = render(<VerifyOtpScreen />);
    const otpInput = screen.getByLabelText("6-digit verification code");
    const verifyButton = screen.getByTestId("verify-submit-button");

    fireEvent.changeText(otpInput, "654321");

    await act(async () => {
      fireEvent.press(verifyButton);
    });

    await waitFor(() => {
      expect(screen.getByText("The verification code is invalid.")).toBeTruthy();
    });
  });

  it("navigates back to login when change mobile number link is pressed", () => {
    const screen = render(<VerifyOtpScreen />);
    const changePhoneLink = screen.getByText("← Change mobile number");

    fireEvent.press(changePhoneLink);

    expect(router.replace).toHaveBeenCalledWith("/(public)/login");
  });
});
