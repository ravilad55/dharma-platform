import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { borderRadius, colors, shadows, spacing } from "./tokens";
import { DharmaButton } from "./DharmaButton";

export interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  testID,
  style,
}: EmptyStateProps) {
  return (
    <View testID={testID} style={[styles.container, style]}>
      {icon ? <View style={styles.iconCircle}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <DharmaButton
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="medium"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  testID?: string;
  style?: ViewStyle;
}

/** User-facing failure state. Raw technical errors are never rendered. */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
  testID,
  style,
}: ErrorStateProps) {
  return (
    <View testID={testID} style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          style={styles.retry}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: "Inter",
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  message: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.lg,
    minWidth: 220,
  },
  retry: {
    minHeight: 44,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  retryText: {
    fontFamily: "Inter",
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
