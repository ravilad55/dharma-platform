import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  DharmaButton,
  DharmaCheckbox,
  DharmaLogo,
  PasswordInput,
  PhoneInput,
} from "../../src/design-system";

describe("Dharma Design System Components", () => {
  describe("DharmaLogo", () => {
    it("renders DHARMA text in default size", () => {
      const screen = render(<DharmaLogo />);
      expect(screen.getByText("DHARMA")).toBeTruthy();
    });

    it("renders in small and large size", () => {
      const smallScreen = render(<DharmaLogo size="small" />);
      expect(smallScreen.getByText("DHARMA")).toBeTruthy();

      const largeScreen = render(<DharmaLogo size="large" />);
      expect(largeScreen.getByText("DHARMA")).toBeTruthy();
    });
  });

  describe("DharmaButton", () => {
    it("renders title and handles onPress", () => {
      const onPress = jest.fn();
      const screen = render(<DharmaButton title="Test Button" onPress={onPress} />);

      const button = screen.getByText("Test Button");
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("displays loading indicator when loading is true", () => {
      const onPress = jest.fn();
      const screen = render(
        <DharmaButton title="Submit" onPress={onPress} loading={true} />
      );

      expect(screen.queryByText("Submit")).toBeNull();
      expect(screen.getByLabelText("Submit loading")).toBeTruthy();

      fireEvent.press(screen.getByLabelText("Submit loading"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("does not call onPress when disabled", () => {
      const onPress = jest.fn();
      const screen = render(
        <DharmaButton title="Disabled" onPress={onPress} disabled={true} />
      );

      fireEvent.press(screen.getByText("Disabled"));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("PhoneInput", () => {
    it("renders label, country code, and handles text input", () => {
      const onChangeText = jest.fn();
      const screen = render(
        <PhoneInput
          value=""
          onChangeText={onChangeText}
          label="Mobile Number"
          placeholder="Enter mobile number"
        />
      );

      expect(screen.getByText("Mobile Number")).toBeTruthy();
      expect(screen.getByText("+91")).toBeTruthy();

      const input = screen.getByPlaceholderText("Enter mobile number");
      fireEvent.changeText(input, "9876543210");

      expect(onChangeText).toHaveBeenCalledWith("9876543210");
    });

    it("renders error message when error prop is provided", () => {
      const screen = render(
        <PhoneInput
          value=""
          onChangeText={jest.fn()}
          error="Invalid phone number"
        />
      );

      expect(screen.getByText("Invalid phone number")).toBeTruthy();
    });
  });

  describe("PasswordInput", () => {
    it("renders password input and handles show/hide toggle", () => {
      const onChangeText = jest.fn();
      const screen = render(
        <PasswordInput
          value="mySecret"
          onChangeText={onChangeText}
          label="Password"
          placeholder="Enter your password"
        />
      );

      const input = screen.getByPlaceholderText("Enter your password");
      expect(input.props.secureTextEntry).toBe(true);

      const toggleButton = screen.getByLabelText("Show password");
      fireEvent.press(toggleButton);

      expect(input.props.secureTextEntry).toBe(false);
    });

    it("renders error message when error is present", () => {
      const screen = render(
        <PasswordInput
          value=""
          onChangeText={jest.fn()}
          error="Password is required"
        />
      );

      expect(screen.getByText("Password is required")).toBeTruthy();
    });
  });

  describe("DharmaCheckbox", () => {
    it("renders label and toggles on press", () => {
      const onToggle = jest.fn();
      const screen = render(
        <DharmaCheckbox
          label="Remember me"
          checked={false}
          onToggle={onToggle}
        />
      );

      expect(screen.getByText("Remember me")).toBeTruthy();
      const checkbox = screen.getByLabelText("Remember me");
      fireEvent.press(checkbox);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});
