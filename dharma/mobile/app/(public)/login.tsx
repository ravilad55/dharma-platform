import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useAuthStore } from "../../src/auth/store";
import {
  borderRadius,
  colors,
  DharmaButton,
  DharmaCheckbox,
  DharmaLogo,
  PasswordInput,
  PhoneInput,
  shadows,
  spacing,
} from "../../src/design-system";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  const requestOtp = useAuthStore((state) => state.requestOtp);

  const normalizePhone = (raw: string): string => {
    const cleaned = raw.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    return cleaned.length > 0 ? `+91${cleaned}` : "";
  };

  const validatePhone = (raw: string): string | null => {
    const digitsOnly = raw.replace(/[^\d]/g, "");
    if (!digitsOnly) {
      return "Please enter your mobile number.";
    }
    const standardDigits =
      digitsOnly.startsWith("91") && digitsOnly.length === 12
        ? digitsOnly.slice(2)
        : digitsOnly;

    if (standardDigits.length !== 10) {
      return "Please enter a valid 10-digit mobile number.";
    }
    return null;
  };

  const handleContinueWithOtp = async () => {
    setPhoneError(null);
    setPasswordError(null);
    setGeneralError(null);
    setInfoMessage(null);

    const error = validatePhone(phoneNumber);
    if (error) {
      setPhoneError(error);
      return;
    }

    const formatted = normalizePhone(phoneNumber);
    setIsOtpLoading(true);

    try {
      const challenge = await requestOtp(formatted, "customer-mobile-device");
      setIsOtpLoading(false);
      router.push({
        pathname: "/(public)/verify-otp",
        params: { challengeId: challenge.challengeId },
      });
    } catch {
      setIsOtpLoading(false);
      setGeneralError("We could not send a verification code. Please try again.");
    }
  };

  const handlePasswordLogin = () => {
    setGeneralError(null);
    setInfoMessage(null);
    setPhoneError(null);
    setPasswordError(null);

    const phoneErr = validatePhone(phoneNumber);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    if (!password.trim()) {
      setPasswordError("Please enter your password.");
      return;
    }

    // Backend authentication is currently OTP-based
    setInfoMessage(
      "Password authentication is currently not enabled for your account. Please use \"Continue with OTP\" to log in securely."
    );
  };

  const handleForgotPassword = () => {
    const message =
      "Password reset is not enabled. Please sign in using OTP verification.";
    setInfoMessage(message);
    if (Platform.OS !== "web") {
      Alert.alert("Forgot Password", message);
    }
  };

  const handleSignUp = () => {
    const message =
      "New accounts are registered automatically via OTP verification. Enter your mobile number and tap \"Continue with OTP\".";
    setInfoMessage(message);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardContainer}>
            {/* 1 & 2: Logo and Brand Header */}
            <View style={styles.logoSection}>
              <DharmaLogo size="large" />
            </View>

            {/* 3 & 4: Welcome Titles */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Login to continue</Text>
            </View>

            {/* General Alert / Info Feedback */}
            {generalError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            ) : null}

            {infoMessage ? (
              <View style={styles.infoBanner} accessibilityRole="text">
                <Text style={styles.infoBannerText}>{infoMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.formSection}>
              {/* 5: Mobile Number Field */}
              <PhoneInput
                testID="phone-input"
                label="Mobile Number"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChangeText={(val) => {
                  setPhoneNumber(val);
                  if (phoneError) setPhoneError(null);
                }}
                error={phoneError}
              />

              {/* 6: Password Field */}
              <PasswordInput
                testID="password-input"
                style={styles.fieldSpacing}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (passwordError) setPasswordError(null);
                }}
                error={passwordError}
              />

              {/* 7 & 8: Remember me and Forgot Password Row */}
              <View style={styles.optionsRow}>
                <DharmaCheckbox
                  testID="remember-me-checkbox"
                  label="Remember me"
                  checked={rememberMe}
                  onToggle={() => setRememberMe((prev) => !prev)}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Forgot Password?"
                  onPress={handleForgotPassword}
                  hitSlop={8}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>
              </View>

              {/* 9: Primary Login Button */}
              <DharmaButton
                testID="login-button"
                title="Login"
                variant="primary"
                size="large"
                onPress={handlePasswordLogin}
                style={styles.loginButton}
              />

              {/* 10: OR Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 11: Continue with OTP Secondary CTA */}
              <DharmaButton
                testID="otp-button"
                title="Continue with OTP"
                variant="outline"
                size="large"
                loading={isOtpLoading}
                onPress={() => void handleContinueWithOtp()}
                style={styles.otpButton}
                textStyle={styles.otpButtonText}
              />
            </View>

            {/* 12: Sign Up Footer */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>
                Don't have an account?{" "}
                <Text
                  style={styles.signUpLink}
                  accessibilityRole="link"
                  onPress={handleSignUp}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  formSection: {
    width: "100%",
  },
  fieldSpacing: {
    marginTop: spacing.md,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  loginButton: {
    marginTop: spacing.xs,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
  },
  otpButton: {
    backgroundColor: colors.warmCreamLight,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  otpButtonText: {
    color: colors.primary,
    fontWeight: "700",
  },
  footerSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.textMuted,
  },
  signUpLink: {
    fontWeight: "700",
    color: colors.primary,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.borderError,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: colors.error,
    textAlign: "center",
  },
  infoBanner: {
    backgroundColor: colors.saffronLight,
    borderWidth: 1,
    borderColor: colors.saffron,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  infoBannerText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
  },
});
