import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { borderRadius, colors, spacing } from "./tokens";

export type StatusTone =
  | "pending"
  | "confirmed"
  | "progress"
  | "delivered"
  | "cancelled"
  | "neutral";

export interface DharmaStatusBadgeProps {
  label: string;
  tone?: StatusTone;
  testID?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const tonePalettes: Record<StatusTone, { background: string; border: string; text: string }> = {
  pending: { background: colors.saffronLight, border: colors.saffron, text: colors.saffronDark },
  confirmed: { background: colors.primaryLight, border: colors.primary, text: colors.primary },
  progress: { background: colors.warmCreamDark, border: colors.borderHover, text: colors.text },
  delivered: { background: colors.greenLight, border: colors.green, text: colors.green },
  cancelled: { background: colors.errorLight, border: colors.error, text: colors.error },
  neutral: { background: colors.warmCreamDark, border: colors.border, text: colors.textMuted },
};

/**
 * Status pill for server-owned state. The status text is always rendered next to the colour,
 * so the state is never communicated through colour alone.
 */
export function DharmaStatusBadge({
  label,
  tone = "neutral",
  testID,
  accessibilityLabel,
  style,
}: DharmaStatusBadgeProps) {
  const palette = tonePalettes[tone];

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `Status: ${label}`}
      style={[
        styles.badge,
        { backgroundColor: palette.background, borderColor: palette.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    minHeight: 28,
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
  },
});
