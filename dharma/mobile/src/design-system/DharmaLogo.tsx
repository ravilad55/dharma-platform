import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, spacing } from "./tokens";

interface DharmaLogoProps {
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

export function DharmaLogo({ size = "medium", style }: DharmaLogoProps) {
  const isSmall = size === "small";
  const isLarge = size === "large";

  const scale = isSmall ? 0.75 : isLarge ? 1.25 : 1;
  const wordmarkSize = isSmall ? 20 : isLarge ? 30 : 24;

  return (
    <View style={[styles.container, style]} accessibilityRole="header">
      {/* Diya / Lamp Visual Motif */}
      <View
        style={[
          styles.diyaContainer,
          {
            width: 52 * scale,
            height: 48 * scale,
          },
        ]}
      >
        {/* Outer Radiant Glow */}
        <View
          style={[
            styles.radiantGlow,
            {
              width: 32 * scale,
              height: 32 * scale,
              borderRadius: (32 * scale) / 2,
              top: 2 * scale,
            },
          ]}
        />

        {/* Flame - Outer Saffron */}
        <View
          style={[
            styles.flameOuter,
            {
              width: 14 * scale,
              height: 20 * scale,
              borderTopLeftRadius: 7 * scale,
              borderTopRightRadius: 7 * scale,
              borderBottomLeftRadius: 10 * scale,
              borderBottomRightRadius: 10 * scale,
              top: 6 * scale,
            },
          ]}
        >
          {/* Flame - Inner Golden Core */}
          <View
            style={[
              styles.flameInner,
              {
                width: 7 * scale,
                height: 11 * scale,
                borderTopLeftRadius: 4 * scale,
                borderTopRightRadius: 4 * scale,
                borderBottomLeftRadius: 5 * scale,
                borderBottomRightRadius: 5 * scale,
                bottom: 2 * scale,
              },
            ]}
          />
        </View>

        {/* Diya Vessel / Bowl */}
        <View
          style={[
            styles.diyaBowl,
            {
              width: 44 * scale,
              height: 15 * scale,
              borderBottomLeftRadius: 22 * scale,
              borderBottomRightRadius: 22 * scale,
              top: 22 * scale,
            },
          ]}
        >
          {/* Diya Rim Highlight */}
          <View
            style={[
              styles.diyaRim,
              {
                height: 3 * scale,
              },
            ]}
          />
        </View>

        {/* Diya Base Stand */}
        <View
          style={[
            styles.diyaBase,
            {
              width: 18 * scale,
              height: 4 * scale,
              borderRadius: 2 * scale,
              top: 36 * scale,
            },
          ]}
        />
      </View>

      {/* DHARMA Wordmark */}
      <View style={styles.wordmarkContainer}>
        <Text
          style={[
            styles.wordmark,
            {
              fontSize: wordmarkSize,
              letterSpacing: isSmall ? 2.5 : 4,
            },
          ]}
        >
          DHARMA
        </Text>
        <View style={styles.accentDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  diyaContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  radiantGlow: {
    position: "absolute",
    backgroundColor: colors.saffronLight,
    opacity: 0.6,
  },
  flameOuter: {
    position: "absolute",
    backgroundColor: colors.saffron,
    alignItems: "center",
    justifyContent: "flex-end",
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  flameInner: {
    backgroundColor: "#FEF08A",
  },
  diyaBowl: {
    position: "absolute",
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    overflow: "hidden",
  },
  diyaRim: {
    width: "100%",
    backgroundColor: colors.saffron,
    opacity: 0.85,
  },
  diyaBase: {
    position: "absolute",
    backgroundColor: colors.saffronDark,
  },
  wordmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  wordmark: {
    fontFamily: "Inter",
    fontWeight: "800",
    color: colors.primary,
  },
  accentDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.saffron,
    marginLeft: 3,
    marginBottom: 4,
  },
});
