import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { borderRadius, colors, shadows, spacing } from "./tokens";

export interface DharmaButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text" | "cream";
  size?: "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export function DharmaButton({
  title,
  onPress,
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle,
  testID,
}: DharmaButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      disabled={!isInteractive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === "large" ? styles.sizeLarge : styles.sizeMedium,
        variant === "primary" && styles.primaryBase,
        variant === "secondary" && styles.secondaryBase,
        variant === "outline" && styles.outlineBase,
        variant === "text" && styles.textBase,
        variant === "cream" && styles.creamBase,
        pressed && isInteractive && variant === "primary" && styles.primaryPressed,
        pressed && isInteractive && variant === "secondary" && styles.secondaryPressed,
        pressed && isInteractive && variant === "outline" && styles.outlinePressed,
        pressed && isInteractive && variant === "text" && styles.textPressed,
        pressed && isInteractive && variant === "cream" && styles.creamPressed,
        disabled && styles.disabledBase,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary"
              ? colors.white
              : variant === "outline" || variant === "secondary" || variant === "cream"
              ? colors.primary
              : colors.primary
          }
          accessibilityLabel={`${title} loading`}
        />
      ) : (
        <Text
          style={[
            styles.baseText,
            size === "large" ? styles.textLarge : styles.textMedium,
            variant === "primary" && styles.primaryText,
            variant === "secondary" && styles.secondaryText,
            variant === "outline" && styles.outlineText,
            variant === "text" && styles.textVariantText,
            variant === "cream" && styles.creamText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
  },
  sizeMedium: {
    height: 44,
    paddingHorizontal: spacing.md,
  },
  sizeLarge: {
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  primaryBase: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  primaryPressed: {
    backgroundColor: colors.primaryActive,
  },
  creamBase: {
    backgroundColor: colors.warmCream,
    ...shadows.md,
  },
  creamPressed: {
    backgroundColor: colors.warmCreamDark,
  },
  secondaryBase: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryPressed: {
    backgroundColor: colors.warmCreamDark,
  },
  outlineBase: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  outlinePressed: {
    backgroundColor: colors.warmCreamLight,
    borderColor: colors.borderHover,
  },
  textBase: {
    backgroundColor: colors.transparent,
  },
  textPressed: {
    opacity: 0.7,
  },
  disabledBase: {
    backgroundColor: colors.warmCreamDark,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  baseText: {
    fontFamily: "Inter",
    fontWeight: "600",
    textAlign: "center",
  },
  textMedium: {
    fontSize: 15,
  },
  textLarge: {
    fontSize: 16,
  },
  primaryText: {
    color: colors.white,
  },
  creamText: {
    color: colors.primary,
    fontWeight: "700",
  },
  secondaryText: {
    color: colors.primary,
  },
  outlineText: {
    color: colors.text,
  },
  textVariantText: {
    color: colors.primary,
  },
  disabledText: {
    color: colors.textSubtle,
  },
});
