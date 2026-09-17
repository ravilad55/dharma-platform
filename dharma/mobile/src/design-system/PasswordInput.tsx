import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { EyeIcon, EyeOffIcon } from "./icons";
import { borderRadius, colors, spacing } from "./tokens";

export interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  error?: string | null;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function PasswordInput({
  value,
  onChangeText,
  label = "Password",
  placeholder = "Enter your password",
  error,
  disabled = false,
  style,
  inputStyle,
  testID,
  onBlur,
  onFocus,
}: PasswordInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <TextInput
          testID={testID}
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          accessibilityLabel={label}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          accessibilityHint="Toggles password visibility"
          onPress={() => setShowPassword((prev) => !prev)}
          style={styles.eyeButton}
          hitSlop={8}
        >
          {showPassword ? (
            <EyeOffIcon size={20} color={colors.textMuted} />
          ) : (
            <EyeIcon size={20} color={colors.textMuted} />
          )}
        </Pressable>
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
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    color: colors.text,
    height: "100%",
  },
  eyeButton: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
