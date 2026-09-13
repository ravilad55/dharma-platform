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
  DharmaLogo,
  MandalaBackground,
  ServiceBadge,
  spacing,
} from "../../src/design-system";

export default function OnboardingScreen1() {
  const handleGetStarted = () => {
    router.push("/(onboarding)/onboarding-2");
  };

  const handleLogin = () => {
    router.push("/(public)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MandalaBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <DharmaLogo size="large" variant="light" />
          </View>

          {/* Main Headline */}
          <View style={styles.headlineSection}>
            <Text style={styles.headline}>
              Your one stop for{"\n"}
              Spirituality, Purity{"\n"}
              and Convenience
            </Text>
          </View>

          {/* 4 Horizontal Service Badges */}
          <View style={styles.servicesSection}>
            <ServiceBadge type="pandits" label="Pandits" />
            <ServiceBadge type="samagri" label="Pooja Samagri" />
            <ServiceBadge type="restaurants" label="Pure Veg Restaurants" />
            <ServiceBadge type="delivery" label="Delivery Services" />
          </View>

          {/* Bottom Action Area */}
          <View style={styles.bottomSection}>
            <DharmaButton
              testID="onboarding-get-started-button"
              title="Get Started"
              variant="cream"
              size="large"
              onPress={handleGetStarted}
              style={styles.getStartedButton}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginPromptText}>
                Already have an account?{" "}
                <Text
                  testID="onboarding-login-link"
                  style={styles.loginLink}
                  accessibilityRole="link"
                  onPress={handleLogin}
                >
                  Login
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
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
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  headlineSection: {
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  headline: {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: "700",
    color: colors.warmCream,
    textAlign: "center",
    lineHeight: 36,
  },
  servicesSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  getStartedButton: {
    width: "100%",
  },
  loginRow: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  loginPromptText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.warmCreamLight,
  },
  loginLink: {
    fontWeight: "700",
    color: "#FEF08A",
    textDecorationLine: "underline",
  },
});
