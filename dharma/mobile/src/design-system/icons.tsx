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

export function PanditIcon({ size = 28, color = colors.saffron, style }: IconProps) {
  return (
    <View
      style={[
        styles.iconBox,
        { width: size, height: size },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Pandits icon"
    >
      {/* Halo / Aura */}
      <View
        style={{
          width: size * 0.75,
          height: size * 0.75,
          borderRadius: (size * 0.75) / 2,
          backgroundColor: color,
          opacity: 0.2,
          position: "absolute",
          top: 0,
        }}
      />
      {/* Head */}
      <View
        style={{
          width: size * 0.38,
          height: size * 0.38,
          borderRadius: (size * 0.38) / 2,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 1,
        }}
      >
        {/* Tilak */}
        <View
          style={{
            width: 2,
            height: 4,
            backgroundColor: colors.primary,
            borderRadius: 1,
          }}
        />
      </View>
      {/* Robe / Shawl */}
      <View
        style={{
          width: size * 0.72,
          height: size * 0.42,
          borderTopLeftRadius: size * 0.36,
          borderTopRightRadius: size * 0.36,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          backgroundColor: color,
          marginTop: 2,
        }}
      />
    </View>
  );
}

export function SamagriIcon({ size = 28, color = colors.saffron, style }: IconProps) {
  return (
    <View
      style={[
        styles.iconBox,
        { width: size, height: size },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Pooja Samagri icon"
    >
      {/* Flame */}
      <View
        style={{
          width: size * 0.26,
          height: size * 0.38,
          borderTopLeftRadius: size * 0.13,
          borderTopRightRadius: size * 0.13,
          borderBottomLeftRadius: size * 0.15,
          borderBottomRightRadius: size * 0.15,
          backgroundColor: color,
          marginBottom: 1,
        }}
      />
      {/* Diya Bowl */}
      <View
        style={{
          width: size * 0.75,
          height: size * 0.28,
          borderBottomLeftRadius: size * 0.38,
          borderBottomRightRadius: size * 0.38,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          backgroundColor: colors.primary,
        }}
      />
      {/* Base */}
      <View
        style={{
          width: size * 0.35,
          height: 3,
          backgroundColor: color,
          borderRadius: 1.5,
          marginTop: 1,
        }}
      />
    </View>
  );
}

export function RestaurantIcon({ size = 28, color = colors.green, style }: IconProps) {
  return (
    <View
      style={[
        styles.iconBox,
        { width: size, height: size },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Pure Veg Restaurants icon"
    >
      {/* Pure Veg Leaf / Bowl */}
      <View
        style={{
          width: size * 0.7,
          height: size * 0.36,
          borderBottomLeftRadius: size * 0.35,
          borderBottomRightRadius: size * 0.35,
          backgroundColor: color,
        }}
      />
      {/* Leaf Sprout */}
      <View
        style={{
          position: "absolute",
          top: size * 0.12,
          width: size * 0.32,
          height: size * 0.32,
          borderTopLeftRadius: size * 0.32,
          borderBottomRightRadius: size * 0.32,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

export function DeliveryIcon({ size = 28, color = colors.saffronDark, style }: IconProps) {
  return (
    <View
      style={[
        styles.iconBox,
        { width: size, height: size },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Delivery Services icon"
    >
      {/* Scooter Body / Package */}
      <View
        style={{
          width: size * 0.62,
          height: size * 0.32,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
      {/* Delivery Wheels */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: size * 0.65,
          marginTop: 2,
        }}
      >
        <View
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: (size * 0.22) / 2,
            backgroundColor: colors.text,
          }}
        />
        <View
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: (size * 0.22) / 2,
            backgroundColor: colors.text,
          }}
        />
      </View>
    </View>
  );
}

export function EasyBookingIcon({ size = 20, color = colors.green }: IconProps) {
  return (
    <View
      style={[styles.badgeIcon, { width: size, height: size, backgroundColor: colors.greenLight }]}
      accessibilityRole="image"
      accessibilityLabel="Easy Booking icon"
    >
      <Text style={{ fontSize: size * 0.65, color, fontWeight: "900" }}>✓</Text>
    </View>
  );
}

export function SecurePaymentIcon({ size = 20, color = colors.green }: IconProps) {
  return (
    <View
      style={[styles.badgeIcon, { width: size, height: size, backgroundColor: colors.greenLight }]}
      accessibilityRole="image"
      accessibilityLabel="Secure Payments icon"
    >
      <Text style={{ fontSize: size * 0.65, color, fontWeight: "900" }}>🛡</Text>
    </View>
  );
}

export function LiveTrackingIcon({ size = 20, color = colors.green }: IconProps) {
  return (
    <View
      style={[styles.badgeIcon, { width: size, height: size, backgroundColor: colors.greenLight }]}
      accessibilityRole="image"
      accessibilityLabel="Live Tracking icon"
    >
      <Text style={{ fontSize: size * 0.65, color, fontWeight: "900" }}>📍</Text>
    </View>
  );
}

export function Support247Icon({ size = 20, color = colors.green }: IconProps) {
  return (
    <View
      style={[styles.badgeIcon, { width: size, height: size, backgroundColor: colors.greenLight }]}
      accessibilityRole="image"
      accessibilityLabel="24/7 Support icon"
    >
      <Text style={{ fontSize: size * 0.6, color, fontWeight: "900" }}>24/7</Text>
    </View>
  );
}

export function MapPinIcon({ size = 18, color = colors.primary, style }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel="Location pin icon"
    >
      {/* Pin head */}
      <View
        style={{
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: (size * 0.72) / 2,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner circle cutout */}
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: (size * 0.28) / 2,
            backgroundColor: colors.white,
          }}
        />
      </View>
      {/* Pin point */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.2,
          borderRightWidth: size * 0.2,
          borderTopWidth: size * 0.28,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: color,
          marginTop: -1,
        }}
      />
    </View>
  );
}

export function ChevronDownIcon({ size = 14, color = colors.primary, style }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel="dropdown icon"
    >
      <Text style={{ fontSize: size * 0.8, color, fontWeight: "700" }}>▼</Text>
    </View>
  );
}

export function ChevronRightIcon({ size = 16, color = colors.textMuted, style }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel="chevron right icon"
    >
      <Text style={{ fontSize: size * 0.9, color, fontWeight: "600" }}>›</Text>
    </View>
  );
}

export function BellIcon({ size = 20, color = colors.text, style }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel="Notification bell icon"
    >
      {/* Bell body */}
      <View
        style={{
          width: size * 0.65,
          height: size * 0.65,
          borderTopLeftRadius: (size * 0.65) / 2,
          borderTopRightRadius: (size * 0.65) / 2,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          borderWidth: 1.8,
          borderColor: color,
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        {/* Top clapper handle */}
        <View
          style={{
            width: 3,
            height: 2,
            backgroundColor: color,
            position: "absolute",
            top: -3,
            borderRadius: 1,
          }}
        />
      </View>
      {/* Bell rim */}
      <View
        style={{
          width: size * 0.8,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          marginTop: -1,
        }}
      />
      {/* Clapper dot */}
      <View
        style={{
          width: 4,
          height: 3,
          backgroundColor: color,
          borderRadius: 2,
          marginTop: 1,
        }}
      />
    </View>
  );
}

export function SearchIcon({ size = 18, color = colors.textMuted, style }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel="Search icon"
    >
      <View
        style={{
          width: size * 0.68,
          height: size * 0.68,
          borderRadius: (size * 0.68) / 2,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 1,
          bottom: 1,
          width: size * 0.35,
          height: 2,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
          borderRadius: 1,
        }}
      />
    </View>
  );
}

export function MicIcon({ size = 18, color = colors.primary, style }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel="Microphone icon"
    >
      {/* Mic capsule */}
      <View
        style={{
          width: size * 0.4,
          height: size * 0.6,
          borderRadius: (size * 0.4) / 2,
          backgroundColor: color,
        }}
      />
      {/* Mic stand base */}
      <View
        style={{
          width: size * 0.65,
          height: size * 0.35,
          borderBottomLeftRadius: (size * 0.65) / 2,
          borderBottomRightRadius: (size * 0.65) / 2,
          borderWidth: 1.5,
          borderTopWidth: 0,
          borderColor: color,
          position: "absolute",
          top: size * 0.25,
        }}
      />
      {/* Mic stem */}
      <View
        style={{
          width: 2,
          height: 3,
          backgroundColor: color,
          marginTop: 2,
        }}
      />
    </View>
  );
}

export function HomeTabIcon({ size = 22, color = colors.primary }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel="Home tab icon"
    >
      {/* Roof */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.44,
          borderRightWidth: size * 0.44,
          borderBottomWidth: size * 0.34,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
      {/* House base */}
      <View
        style={{
          width: size * 0.62,
          height: size * 0.44,
          backgroundColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {/* Door cutout */}
        <View
          style={{
            width: size * 0.22,
            height: size * 0.26,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            backgroundColor: colors.white,
          }}
        />
      </View>
    </View>
  );
}

export function BookingsTabIcon({ size = 22, color = colors.textMuted }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel="Bookings tab icon"
    >
      {/* Calendar header bar */}
      <View
        style={{
          width: size * 0.72,
          height: size * 0.2,
          backgroundColor: color,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          flexDirection: "row",
          justifyContent: "space-around",
          paddingHorizontal: 2,
        }}
      >
        <View style={{ width: 2, height: 3, backgroundColor: colors.white, marginTop: -1, borderRadius: 1 }} />
        <View style={{ width: 2, height: 3, backgroundColor: colors.white, marginTop: -1, borderRadius: 1 }} />
      </View>
      {/* Calendar body */}
      <View
        style={{
          width: size * 0.72,
          height: size * 0.52,
          borderWidth: 1.5,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function OrdersTabIcon({ size = 22, color = colors.textMuted }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel="Orders tab icon"
    >
      {/* Bag handle */}
      <View
        style={{
          width: size * 0.36,
          height: size * 0.24,
          borderTopLeftRadius: (size * 0.36) / 2,
          borderTopRightRadius: (size * 0.36) / 2,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
      {/* Bag body */}
      <View
        style={{
          width: size * 0.68,
          height: size * 0.5,
          borderWidth: 1.6,
          borderColor: color,
          borderRadius: 3,
          backgroundColor: "transparent",
        }}
      />
    </View>
  );
}

export function NotificationsTabIcon({ size = 22, color = colors.textMuted }: IconProps) {
  return <BellIcon size={size} color={color} />;
}

export function ProfileTabIcon({ size = 22, color = colors.textMuted }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel="Profile tab icon"
    >
      {/* Head */}
      <View
        style={{
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: (size * 0.36) / 2,
          borderWidth: 1.6,
          borderColor: color,
        }}
      />
      {/* Shoulders */}
      <View
        style={{
          width: size * 0.68,
          height: size * 0.34,
          borderTopLeftRadius: (size * 0.68) / 2,
          borderTopRightRadius: (size * 0.68) / 2,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: color,
          marginTop: 1,
        }}
      />
    </View>
  );
}

export function CalendarIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return <BookingsTabIcon size={size} color={color} />;
}

export function ClockIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return (
    <View
      style={[styles.iconBox, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel="Clock icon"
    >
      <View
        style={{
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: (size * 0.85) / 2,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: size * 0.18,
            width: 1.5,
            height: size * 0.25,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            right: size * 0.18,
            width: size * 0.22,
            height: 1.5,
            backgroundColor: color,
          }}
        />
      </View>
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
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIcon: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
