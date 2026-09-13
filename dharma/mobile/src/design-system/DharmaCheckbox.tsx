import React from "react";
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { CheckmarkIcon } from "./icons";
import { borderRadius, colors, spacing } from "./tokens";

export interface DharmaCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
}

export function DharmaCheckbox({
  checked,
  onToggle,
  label,
  disabled = false,
  style,
  labelStyle,
  testID,
}: DharmaCheckboxProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onToggle}
      style={[styles.container, style]}
      hitSlop={8}
    >
      <View
        style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
          disabled && styles.checkboxDisabled,
        ]}
      >
        {checked ? (
          <CheckmarkIcon size={12} color={colors.white} />
        ) : null}
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled, labelStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.xs + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDisabled: {
    backgroundColor: colors.warmCreamDark,
    borderColor: colors.border,
  },
  label: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.text,
    fontWeight: "400",
  },
  labelDisabled: {
    color: colors.textSubtle,
  },
});
