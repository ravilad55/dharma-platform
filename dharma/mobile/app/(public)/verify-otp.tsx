import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";

import { useAuthStore } from "../../src/auth/store";
import { getErrorMessage } from "../../src/api/errors";
import {
  borderRadius,
  colors,
  DharmaButton,
  DharmaLogo,
  OtpInput,
  shadows,
  spacing,
} from "../../src/design-system";

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  const status = useAuthStore((state) => state.status);
  const challenge = useAuthStore((state) => state.challenge);
  const phoneNumber = useAuthStore((state) => state.phoneNumber);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const resendOtp = useAuthStore((state) => state.resendOtp);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (status === "authenticated") {
    return <Redirect href="/(protected)/home" />;
  }

  const handleVerify = async () => {
    setError(null);
    setInfoMessage(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    try {
      await verifyOtp(cleanOtp, "customer-mobile-device");
      setIsVerifying(false);
      router.replace("/(protected)/home");
    } catch (err) {
      setIsVerifying(false);
      const message = getErrorMessage(
        err,
        "That code is invalid or expired. Request a new code and try again."
      );
      setError(message);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setInfoMessage(null);
    setIsResending(true);

    try {
      await resendOtp();
      setIsResending(false);
      setResendCooldown(30);
      setInfoMessage("A new verification code has been sent to your mobile number.");
    } catch (err) {
      setIsResending(false);
      const message = getErrorMessage(
        err,
        "We could not resend the verification code. Please wait and try again."
      );
      setError(message);
    }
  };

  const displayPhone = challenge?.maskedPhone || phoneNumber || "your mobile number";

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
            {/* Logo */}
            <View style={styles.logoSection}>
              <DharmaLogo size="large" />
            </View>

            {/* Header Titles */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Verify Phone</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit verification code sent to{"\n"}
                <Text style={styles.phoneHighlight}>{displayPhone}</Text>
              </Text>
            </View>

            {/* Alerts */}
            {error ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {infoMessage ? (
              <View style={styles.infoBanner} accessibilityRole="text">
                <Text style={styles.infoBannerText}>{infoMessage}</Text>
              </View>
            ) : null}

            {/* OTP Input */}
            <View style={styles.formSection}>
              <OtpInput
                testID="otp-input"
                value={otp}
                onChangeText={(val) => {
                  setOtp(val);
                  if (error) setError(null);
                }}
                autoFocus
                disabled={isVerifying}
              />

              {/* Verify Button */}
              <DharmaButton
                testID="verify-submit-button"
                title="Verify"
                variant="primary"
                size="large"
                loading={isVerifying}
                disabled={otp.trim().length !== 6 || isVerifying}
                onPress={() => void handleVerify()}
                style={styles.verifyButton}
              />

              {/* Resend OTP Section */}
              <View style={styles.resendSection}>
                <Text style={styles.resendLabel}>Didn't receive the code?</Text>
                {resendCooldown > 0 ? (
                  <Text style={styles.cooldownText}>
                    Resend available in {resendCooldown}s
                  </Text>
                ) : (
                  <DharmaButton
                    testID="resend-otp-button"
                    title="Resend code"
                    variant="text"
                    loading={isResending}
                    onPress={() => void handleResend()}
                    style={styles.resendButton}
                    textStyle={styles.resendButtonText}
                  />
                )}
              </View>
            </View>

            {/* Change Number Footer */}
            <View style={styles.footerSection}>
              <Text
                style={styles.changePhoneLink}
                accessibilityRole="link"
                onPress={() => router.replace("/(public)/login")}
              >
                ← Change mobile number
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
    lineHeight: 20,
  },
  phoneHighlight: {
    fontWeight: "600",
    color: colors.text,
  },
  formSection: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  verifyButton: {
    marginTop: spacing.xl,
  },
  resendSection: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  resendLabel: {
    fontFamily: "Inter",
    fontSize: 13,
    color: colors.textMuted,
  },
  cooldownText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "600",
    color: colors.saffronDark,
    marginTop: spacing.xs,
  },
  resendButton: {
    marginTop: spacing.xs,
  },
  resendButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  footerSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  changePhoneLink: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.borderError,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    width: "100%",
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
    width: "100%",
  },
  infoBannerText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
  },
});
