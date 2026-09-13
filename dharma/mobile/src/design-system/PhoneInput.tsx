import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { borderRadius, colors, spacing } from "./tokens";

export interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  error?: string | null;
  countryCode?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function PhoneInput({
  value,
  onChangeText,
  label = "Mobile Number",
  placeholder = "Enter mobile number",
  error,
  countryCode = "+91",
  disabled = false,
  style,
  inputStyle,
  testID,
  onBlur,
  onFocus,
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const hasError = Boolean(error);

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        {/* Country Code Pill / Section */}
        <View style={styles.countryCodeContainer}>
          <Text style={styles.countryCodeText}>{countryCode}</Text>
          <View style={styles.separator} />
        </View>

        {/* Input Field */}
        <TextInput
          testID={testID}
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          editable={!disabled}
          accessibilityLabel={label}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={15}
        />
      </View>

      {hasError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
  },
  inputError: {
    borderColor: colors.borderError,
  },
  inputDisabled: {
    backgroundColor: colors.warmCreamDark,
    borderColor: colors.border,
  },
  countryCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.sm,
  },
  countryCodeText: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
    marginLeft: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    color: colors.text,
    paddingLeft: spacing.sm,
    height: "100%",
  },
  errorText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
