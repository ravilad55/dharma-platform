import React from "react";
import { DimensionValue, StyleSheet, View, ViewStyle } from "react-native";

import { borderRadius, colors } from "./tokens";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
  accessibilityLabel?: string;
}

/** Placeholder block used while server data loads, so screens never show a blank surface. */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = borderRadius.sm,
  style,
  testID,
  accessibilityLabel = "Loading",
}: SkeletonProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={[styles.block, { width, height, borderRadius: radius }, style]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.warmCreamDark,
  },
});
