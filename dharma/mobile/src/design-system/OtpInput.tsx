import React, { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { borderRadius, colors, shadows, spacing } from "./tokens";

export interface OtpInputProps {
  value: string;
  onChangeText: (code: string) => void;
  length?: number;
  error?: string | null;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  error,
  disabled = false,
  style,
  testID,
  autoFocus = false,
}: OtpInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const cleanValue = value.replace(/[^\d]/g, "").slice(0, length);

  return (
    <View style={[styles.container, style]}>
      {/* Hidden real TextInput */}
      <TextInput
        ref={inputRef}
        testID={testID}
        style={styles.hiddenInput}
        value={cleanValue}
        onChangeText={(text) => {
          const digits = text.replace(/[^\d]/g, "").slice(0, length);
          onChangeText(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        editable={!disabled}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={`${length}-digit verification code`}
      />

      {/* Visual digit cells */}
      <Pressable
        onPress={handlePress}
        style={styles.cellsContainer}
        accessibilityRole="button"
        accessibilityLabel="Enter verification code"
      >
        {Array.from({ length }).map((_, index) => {
          const digit = cleanValue[index] ?? "";
          const isCurrentFocus = isFocused && (index === cleanValue.length || (index === length - 1 && cleanValue.length === length));
          const hasError = Boolean(error);

          return (
            <View
              key={index}
              style={[
                styles.cell,
                digit ? styles.cellFilled : null,
                isCurrentFocus ? styles.cellFocused : null,
                hasError ? styles.cellError : null,
                disabled ? styles.cellDisabled : null,
              ]}
            >
              <Text style={[styles.digitText, disabled && styles.digitDisabled]}>
                {digit}
              </Text>
            </View>
          );
        })}
      </Pressable>

      {error ? (
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
    alignItems: "center",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  cellsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 340,
  },
  cell: {
    width: 48,
    height: 54,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  cellFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.warmCreamLight,
  },
  cellFocused: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.white,
    borderWidth: 2,
  },
  cellError: {
    borderColor: colors.borderError,
    backgroundColor: colors.errorLight,
  },
  cellDisabled: {
    backgroundColor: colors.warmCreamDark,
    borderColor: colors.border,
  },
  digitText: {
    fontFamily: "Inter",
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  digitDisabled: {
    color: colors.textSubtle,
  },
  errorText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
