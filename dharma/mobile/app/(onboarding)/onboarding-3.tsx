import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useAuthStore } from "../../src/auth/store";
import {
  colors,
  DharmaButton,
  OnboardingPagination,
  PrayingPersonIllustration,
  spacing,
  TempleIllustration,
  TrustItem,
} from "../../src/design-system";

export default function OnboardingScreen3() {
  const setOnboardingCompleted = useAuthStore((state) => state.setOnboardingCompleted);

  const handleGetStarted = async () => {
    await setOnboardingCompleted(true);
    router.replace("/(public)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Top Heading */}
          <View style={styles.headingSection}>
            <Text style={styles.heading}>
              Made for your{"\n"}
              spiritual journey
            </Text>
          </View>

          {/* Devotee Praying Illustration */}
          <View style={styles.prayingIllustrationSection}>
            <PrayingPersonIllustration size={110} />
          </View>

          {/* Trust Pillars Grid / List */}
          <View style={styles.trustSection}>
            <TrustItem type="booking" title="Easy Booking" />
            <TrustItem type="payments" title="Secure Payments" />
            <TrustItem type="tracking" title="Live Tracking" />
            <TrustItem type="support" title="24/7 Support" />
          </View>

          {/* Spiritual Temple Backdrop */}
          <View style={styles.templeBackdropSection}>
            <TempleIllustration size={90} />
          </View>

          {/* Pagination & Get Started Button */}
          <View style={styles.bottomSection}>
            <OnboardingPagination currentStep={3} totalSteps={3} />

            <DharmaButton
              testID="onboarding-finish-button"
              title="Get Started"
              variant="primary"
              size="large"
              onPress={() => void handleGetStarted()}
              style={styles.finishButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  contentContainer: {
    width: "100%",
    maxWidth: 420,
    flex: 1,
    justifyContent: "space-between",
  },
  headingSection: {
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading: {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
    lineHeight: 34,
  },
  prayingIllustrationSection: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  trustSection: {
    width: "100%",
    marginVertical: spacing.xs,
  },
  templeBackdropSection: {
    alignItems: "center",
    marginVertical: spacing.xs,
    opacity: 0.6,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  finishButton: {
    width: "100%",
    marginTop: spacing.sm,
  },
});
