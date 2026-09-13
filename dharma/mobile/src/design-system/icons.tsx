import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "./tokens";

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function EyeIcon({ size = 20, color = colors.textMuted, style }: IconProps) {
  const outerWidth = size * 1.1;
  const outerHeight = size * 0.7;
  const pupilSize = size * 0.38;

  return (
    <View
      style={[
        styles.eyeContainer,
        { width: size * 1.2, height: size * 0.8 },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="eye-icon"
    >
      {/* Outer Eye Shape */}
      <View
        style={[
          styles.eyeOutline,
          {
            width: outerWidth,
            height: outerHeight,
            borderColor: color,
            borderTopLeftRadius: outerWidth / 2,
            borderBottomRightRadius: outerWidth / 2,
            borderTopRightRadius: outerWidth / 2,
            borderBottomLeftRadius: outerWidth / 2,
          },
        ]}
      >
        {/* Inner Pupil */}
        <View
          style={[
            styles.eyePupil,
            {
              width: pupilSize,
              height: pupilSize,
              borderRadius: pupilSize / 2,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function EyeOffIcon({ size = 20, color = colors.textMuted, style }: IconProps) {
  const outerWidth = size * 1.1;
  const outerHeight = size * 0.7;

  return (
    <View
      style={[
        styles.eyeContainer,
        { width: size * 1.2, height: size * 0.8 },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="eye-off-icon"
    >
      <View
        style={[
          styles.eyeOutline,
          {
            width: outerWidth,
            height: outerHeight,
            borderColor: color,
            borderTopLeftRadius: outerWidth / 2,
            borderBottomRightRadius: outerWidth / 2,
            borderTopRightRadius: outerWidth / 2,
            borderBottomLeftRadius: outerWidth / 2,
          },
        ]}
      />
      {/* Slash Line */}
      <View
        style={[
          styles.slashLine,
          {
            width: size * 1.3,
            height: 1.8,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export function CheckmarkIcon({ size = 12, color = colors.white, style }: IconProps) {
  return (
    <View
      style={[
        styles.checkContainer,
        { width: size * 1.2, height: size },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="checkmark-icon"
    >
      <Text
        style={[
          styles.checkGlyph,
          {
            fontSize: size * 1.1,
            color,
            lineHeight: size * 1.2,
          },
        ]}
      >
        ✓
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyeContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  eyeOutline: {
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
  },
  eyePupil: {
    backgroundColor: colors.textMuted,
  },
  slashLine: {
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
  },
  checkContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkGlyph: {
    fontWeight: "900",
    textAlign: "center",
  },
});
