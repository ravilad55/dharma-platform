import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuthStore } from "../src/auth/store";
import { colors, DharmaLogo, spacing } from "../src/design-system";

export default function Index() {
  const status = useAuthStore((state) => state.status);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status === "bootstrapping") {
    return (
      <View style={styles.splashContainer}>
        <DharmaLogo size="large" />
        <View style={styles.spinnerContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel="Restoring session"
          />
        </View>
      </View>
    );
  }

  // Case C: Authenticated user goes directly to Home
  if (status === "authenticated") {
    return <Redirect href="/(protected)/home" />;
  }

  // Case A: First install (unauthenticated and onboarding not yet completed)
  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)/onboarding-1" />;
  }

  // Case B & D: Unauthenticated user with completed onboarding goes to Login
  return <Redirect href="/(public)/login" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.warmCream,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    marginTop: spacing.xl,
  },
});
