import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  colors,
  DharmaButton,
  FeatureRow,
  OnboardingPagination,
  spacing,
  TempleIllustration,
} from "../../src/design-system";

export default function OnboardingScreen2() {
  const handleNext = () => {
    router.push("/(onboarding)/onboarding-3");
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
              Everything you need{"\n"}
              in one place
            </Text>
          </View>

          {/* 4 Feature Rows */}
          <View style={styles.featuresSection}>
            <FeatureRow
              type="pandits"
              title="Trusted Pandits"
              subtitle="Verified & experienced"
            />
            <FeatureRow
              type="samagri"
              title="Pooja Samagri"
              subtitle="Pure & authentic items"
            />
            <FeatureRow
              type="restaurants"
              title="Pure Veg Restaurants"
              subtitle="Nearby pure veg food"
            />
            <FeatureRow
              type="delivery"
              title="Delivery Services"
              subtitle="Fast & reliable delivery"
            />
          </View>

          {/* Spiritual Temple Illustration */}
          <View style={styles.illustrationSection}>
            <TempleIllustration size={110} />
          </View>

          {/* Pagination & Next Button */}
          <View style={styles.bottomSection}>
            <OnboardingPagination currentStep={2} totalSteps={3} />

            <DharmaButton
              testID="onboarding-next-button"
              title="Next"
              variant="primary"
              size="large"
              onPress={handleNext}
              style={styles.nextButton}
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
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
    lineHeight: 34,
  },
  featuresSection: {
    width: "100%",
    marginVertical: spacing.sm,
  },
  illustrationSection: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.md,
  },
  nextButton: {
    width: "100%",
    marginTop: spacing.sm,
  },
});
