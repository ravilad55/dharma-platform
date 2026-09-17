import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  BottomTabBar,
  DharmaButton,
  DharmaCheckbox,
  DharmaLogo,
  DharmaSearchBar,
  ExploreServices,
  FeatureRow,
  HomeGreeting,
  HomeHeader,
  MandalaBackground,
  OnboardingPagination,
  OtpInput,
  PasswordInput,
  PhoneInput,
  PrayingPersonIllustration,
  ServiceBadge,
  TempleIllustration,
  TrustItem,
  UpcomingBooking,
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

  describe("OtpInput", () => {
    it("renders 6 digit cells and handles input", () => {
      const onChangeText = jest.fn();
      const screen = render(
        <OtpInput
          value="123"
          onChangeText={onChangeText}
        />
      );

      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText("2")).toBeTruthy();
      expect(screen.getByText("3")).toBeTruthy();

      const input = screen.getByLabelText("6-digit verification code");
      fireEvent.changeText(input, "123456");

      expect(onChangeText).toHaveBeenCalledWith("123456");
    });

    it("displays error message when error is provided", () => {
      const screen = render(
        <OtpInput
          value=""
          onChangeText={jest.fn()}
          error="Invalid verification code"
        />
      );

      expect(screen.getByText("Invalid verification code")).toBeTruthy();
    });
  });

  describe("Onboarding Components", () => {
    it("renders ServiceBadge with accessible label", () => {
      const screen = render(
        <ServiceBadge type="pandits" label="Pandits" />
      );
      expect(screen.getByText("Pandits")).toBeTruthy();
      expect(screen.getByLabelText("Pandits")).toBeTruthy();
    });

    it("renders FeatureRow with title and subtitle", () => {
      const screen = render(
        <FeatureRow
          type="samagri"
          title="Pooja Samagri"
          subtitle="Pure & authentic items"
        />
      );
      expect(screen.getByText("Pooja Samagri")).toBeTruthy();
      expect(screen.getByText("Pure & authentic items")).toBeTruthy();
    });

    it("renders TrustItem with label", () => {
      const screen = render(
        <TrustItem type="booking" title="Easy Booking" />
      );
      expect(screen.getByText("Easy Booking")).toBeTruthy();
    });

    it("renders OnboardingPagination with active and inactive indicators", () => {
      const screen = render(
        <OnboardingPagination currentStep={2} totalSteps={3} />
      );
      expect(screen.getByLabelText("Step 2 of 3")).toBeTruthy();
    });

    it("renders TempleIllustration, PrayingPersonIllustration, and MandalaBackground without errors", () => {
      const screen = render(
        <>
          <TempleIllustration />
          <PrayingPersonIllustration />
          <MandalaBackground />
        </>
      );
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  describe("Home Components", () => {
    it("renders HomeHeader with location and notification badge", () => {
      const screen = render(
        <HomeHeader location="Mumbai, Maharashtra" unreadCount={3} />
      );
      expect(screen.getByText("Mumbai, Maharashtra")).toBeTruthy();
      expect(screen.getByText("3")).toBeTruthy();
    });

    it("renders HomeGreeting with user name and fallback", () => {
      const screen = render(<HomeGreeting displayName="Anita" />);
      expect(screen.getByText("Namaste, Anita 🙏")).toBeTruthy();
      expect(screen.getByText("What would you like to do today?")).toBeTruthy();

      const fallbackScreen = render(<HomeGreeting displayName={null} />);
      expect(fallbackScreen.getByText("Namaste, Devotee 🙏")).toBeTruthy();
    });

    it("renders DharmaSearchBar and responds to input", () => {
      const onChangeText = jest.fn();
      const screen = render(
        <DharmaSearchBar
          value=""
          onChangeText={onChangeText}
          placeholder="Search Dharma..."
        />
      );

      const input = screen.getByPlaceholderText("Search Dharma...");
      expect(input).toBeTruthy();
      fireEvent.changeText(input, "Pooja");
      expect(onChangeText).toHaveBeenCalledWith("Pooja");
    });

    it("renders ExploreServices with all 4 services", () => {
      const onSelect = jest.fn();
      const screen = render(<ExploreServices onSelectService={onSelect} />);

      expect(screen.getByText("Explore Services")).toBeTruthy();
      expect(screen.getByText("Pandits")).toBeTruthy();
      expect(screen.getByText("Pooja Samagri")).toBeTruthy();
      expect(screen.getByText("Pure Veg Restaurants")).toBeTruthy();
      expect(screen.getByText("Delivery Services")).toBeTruthy();

      fireEvent.press(screen.getByTestId("service-card-pandits"));
      expect(onSelect).toHaveBeenCalledWith("pandits");
    });

    it("renders UpcomingBooking with active booking data", () => {
      const sampleBooking = {
        id: "b-1",
        poojaName: "Griha Pravesh Pooja",
        panditName: "Pandit Rajesh Shastri",
        scheduledTime: "24 Aug 2026, 10:00 AM",
        status: "Confirmed",
      };

      const screen = render(<UpcomingBooking booking={sampleBooking} />);
      expect(screen.getByText("Griha Pravesh Pooja")).toBeTruthy();
      expect(screen.getByText("Pandit Rajesh Shastri")).toBeTruthy();
      expect(screen.getByText("Confirmed")).toBeTruthy();
    });

    it("renders UpcomingBooking empty state", () => {
      const screen = render(<UpcomingBooking booking={null} />);
      expect(screen.getByText("No upcoming bookings")).toBeTruthy();
      expect(
        screen.getByText("Explore services to make your first sacred booking")
      ).toBeTruthy();
    });

    it("renders BottomTabBar and handles tab clicks", () => {
      const onTabPress = jest.fn();
      const screen = render(
        <BottomTabBar activeTab="home" onTabPress={onTabPress} />
      );

      expect(screen.getByText("Home")).toBeTruthy();
      expect(screen.getByText("Bookings")).toBeTruthy();
      expect(screen.getByText("Orders")).toBeTruthy();
      expect(screen.getByText("Notifications")).toBeTruthy();
      expect(screen.getByText("Profile")).toBeTruthy();

      fireEvent.press(screen.getByTestId("tab-bookings"));
      expect(onTabPress).toHaveBeenCalledWith("bookings");
    });
  });
});
