import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { borderRadius, colors, shadows, spacing } from "./tokens";
import {
  DeliveryIcon,
  EasyBookingIcon,
  LiveTrackingIcon,
  PanditIcon,
  RestaurantIcon,
  SamagriIcon,
  SecurePaymentIcon,
  Support247Icon,
} from "./icons";

/**
 * Decorative Mandala / Radial Aura Background for Screen 1
 */
export function MandalaBackground({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.mandalaContainer, style]} pointerEvents="none">
      <View style={[styles.mandalaRing, { width: 340, height: 340, borderRadius: 170, opacity: 0.08 }]} />
      <View style={[styles.mandalaRing, { width: 270, height: 270, borderRadius: 135, opacity: 0.12 }]} />
      <View style={[styles.mandalaRing, { width: 200, height: 200, borderRadius: 100, opacity: 0.16 }]} />
      <View style={[styles.mandalaRing, { width: 130, height: 130, borderRadius: 65, opacity: 0.2 }]} />
    </View>
  );
}

/**
 * Service Badge for Screen 1 (Pandits, Pooja Samagri, Pure Veg Restaurants, Delivery Services)
 */
export interface ServiceBadgeProps {
  type: "pandits" | "samagri" | "restaurants" | "delivery";
  label: string;
}

export function ServiceBadge({ type, label }: ServiceBadgeProps) {
  const renderIcon = () => {
    switch (type) {
      case "pandits":
        return <PanditIcon size={26} color={colors.saffron} />;
      case "samagri":
        return <SamagriIcon size={26} color={colors.saffron} />;
      case "restaurants":
        return <RestaurantIcon size={26} color={colors.green} />;
      case "delivery":
        return <DeliveryIcon size={26} color={colors.saffronDark} />;
    }
  };

  return (
    <View style={styles.serviceBadgeItem} accessibilityLabel={label}>
      <View style={styles.serviceBadgeCircle}>
        {renderIcon()}
      </View>
      <Text style={styles.serviceBadgeLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Feature Row for Screen 2 (Trusted Pandits, Pooja Samagri, Pure Veg Restaurants, Delivery Services)
 */
export interface FeatureRowProps {
  type: "pandits" | "samagri" | "restaurants" | "delivery";
  title: string;
  subtitle: string;
}

export function FeatureRow({ type, title, subtitle }: FeatureRowProps) {
  const getIconContainer = () => {
    switch (type) {
      case "pandits":
        return {
          icon: <PanditIcon size={26} color={colors.primary} />,
          bg: colors.primaryLight,
        };
      case "samagri":
        return {
          icon: <SamagriIcon size={26} color={colors.saffronDark} />,
          bg: colors.saffronLight,
        };
      case "restaurants":
        return {
          icon: <RestaurantIcon size={26} color={colors.green} />,
          bg: colors.greenLight,
        };
      case "delivery":
        return {
          icon: <DeliveryIcon size={26} color={colors.saffronDark} />,
          bg: colors.saffronLight,
        };
    }
  };

  const { icon, bg } = getIconContainer();

  return (
    <View style={styles.featureRowContainer} accessibilityLabel={`${title}: ${subtitle}`}>
      <View style={[styles.featureIconBox, { backgroundColor: bg }]}>
        {icon}
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

/**
 * Trust Item for Screen 3 (Easy Booking, Secure Payments, Live Tracking, 24/7 Support)
 */
export interface TrustItemProps {
  type: "booking" | "payments" | "tracking" | "support";
  title: string;
}

export function TrustItem({ type, title }: TrustItemProps) {
  const renderIcon = () => {
    switch (type) {
      case "booking":
        return <EasyBookingIcon size={22} color={colors.green} />;
      case "payments":
        return <SecurePaymentIcon size={22} color={colors.green} />;
      case "tracking":
        return <LiveTrackingIcon size={22} color={colors.green} />;
      case "support":
        return <Support247Icon size={22} color={colors.green} />;
    }
  };

  return (
    <View style={styles.trustItemContainer} accessibilityLabel={title}>
      {renderIcon()}
      <Text style={styles.trustItemTitle}>{title}</Text>
    </View>
  );
}

/**
 * Temple Architectural Illustration for Screens 2 & 3
 */
export function TempleIllustration({ size = 100, style }: { size?: number; style?: ViewStyle }) {
  const scale = size / 100;

  return (
    <View style={[styles.templeContainer, { width: 140 * scale, height: 90 * scale }, style]}>
      {/* Central High Spire / Kalash */}
      <View style={[styles.templeSpire, { width: 32 * scale, height: 60 * scale, left: 54 * scale }]}>
        <View style={[styles.kalashPin, { width: 6 * scale, height: 8 * scale, top: -6 * scale, backgroundColor: colors.saffron }]} />
        <View style={[styles.spireTop, { width: 16 * scale, height: 24 * scale, borderBottomLeftRadius: 8 * scale, borderBottomRightRadius: 8 * scale, backgroundColor: colors.border }]} />
        <View style={[styles.spireBody, { width: 28 * scale, height: 30 * scale, backgroundColor: colors.borderHover, borderRadius: 2 * scale }]} />
      </View>

      {/* Left Wing Tower */}
      <View style={[styles.templeSpire, { width: 24 * scale, height: 44 * scale, left: 24 * scale, bottom: 0 }]}>
        <View style={[styles.spireTop, { width: 12 * scale, height: 16 * scale, borderBottomLeftRadius: 6 * scale, borderBottomRightRadius: 6 * scale, backgroundColor: colors.border }]} />
        <View style={[styles.spireBody, { width: 20 * scale, height: 24 * scale, backgroundColor: colors.borderHover, borderRadius: 2 * scale }]} />
      </View>

      {/* Right Wing Tower */}
      <View style={[styles.templeSpire, { width: 24 * scale, height: 44 * scale, left: 92 * scale, bottom: 0 }]}>
        <View style={[styles.spireTop, { width: 12 * scale, height: 16 * scale, borderBottomLeftRadius: 6 * scale, borderBottomRightRadius: 6 * scale, backgroundColor: colors.border }]} />
        <View style={[styles.spireBody, { width: 20 * scale, height: 24 * scale, backgroundColor: colors.borderHover, borderRadius: 2 * scale }]} />
      </View>

      {/* Base Platform */}
      <View style={[styles.templeBase, { width: 130 * scale, height: 12 * scale, borderRadius: 3 * scale, backgroundColor: colors.border }]} />
    </View>
  );
}

/**
 * Praying Devotee (Namaste) Vector Illustration for Screen 3
 */
export function PrayingPersonIllustration({ size = 110, style }: { size?: number; style?: ViewStyle }) {
  const scale = size / 100;

  return (
    <View style={[styles.prayingContainer, { width: 120 * scale, height: 110 * scale }, style]}>
      {/* Glowing Spiritual Aura */}
      <View
        style={[
          styles.prayingAura,
          {
            width: 100 * scale,
            height: 100 * scale,
            borderRadius: (100 * scale) / 2,
            backgroundColor: colors.saffronLight,
          },
        ]}
      />

      {/* Head with Traditional Hair */}
      <View style={[styles.devoteeHead, { width: 34 * scale, height: 40 * scale, top: 12 * scale }]}>
        {/* Hair Bun */}
        <View style={[styles.hairBun, { width: 16 * scale, height: 16 * scale, borderRadius: 8 * scale, top: -6 * scale }]} />
        {/* Face */}
        <View style={[styles.face, { width: 26 * scale, height: 30 * scale, borderRadius: 13 * scale }]}>
          {/* Bindi / Tilak */}
          <View style={[styles.bindi, { width: 3 * scale, height: 3 * scale, borderRadius: 1.5 * scale, backgroundColor: colors.primary, top: 7 * scale }]} />
        </View>
      </View>

      {/* Folded Hands (Namaste) */}
      <View style={[styles.namasteHands, { width: 22 * scale, height: 26 * scale, top: 48 * scale }]}>
        <View style={[styles.namastePalm, { width: 8 * scale, height: 20 * scale, borderTopLeftRadius: 4 * scale, borderBottomLeftRadius: 4 * scale, backgroundColor: "#FBBF24" }]} />
        <View style={[styles.namastePalm, { width: 8 * scale, height: 20 * scale, borderTopRightRadius: 4 * scale, borderBottomRightRadius: 4 * scale, backgroundColor: "#F59E0B" }]} />
      </View>

      {/* Traditional Attire / Shoulders */}
      <View
        style={[
          styles.devoteeTorso,
          {
            width: 76 * scale,
            height: 40 * scale,
            borderTopLeftRadius: 36 * scale,
            borderTopRightRadius: 36 * scale,
            backgroundColor: colors.primary,
            top: 66 * scale,
          },
        ]}
      >
        {/* Saffron Dupatta / Shawl border */}
        <View style={[styles.shawlBorder, { height: 4 * scale, backgroundColor: colors.saffron }]} />
      </View>
    </View>
  );
}

/**
 * 3-Dot Pagination for Onboarding Screens 2 & 3
 */
export function OnboardingPagination({
  currentStep,
  totalSteps = 3,
  style,
}: {
  currentStep: number;
  totalSteps?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.paginationContainer, style]} accessibilityRole="tablist">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;

        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Step ${stepNum} of ${totalSteps}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mandalaContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  mandalaRing: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: colors.warmCream,
  },
  serviceBadgeItem: {
    alignItems: "center",
    width: 72,
    marginHorizontal: spacing.xs,
  },
  serviceBadgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255, 249, 240, 0.12)",
    borderWidth: 1.2,
    borderColor: "rgba(245, 158, 11, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  serviceBadgeLabel: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "600",
    color: colors.warmCream,
    textAlign: "center",
    lineHeight: 14,
  },
  featureRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    width: "100%",
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  featureSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  trustItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
    width: "100%",
    ...shadows.sm,
  },
  trustItemTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  templeContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  templeSpire: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-end",
    bottom: 8,
  },
  kalashPin: {
    borderRadius: 3,
  },
  spireTop: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  spireBody: {},
  templeBase: {
    position: "absolute",
    bottom: 0,
  },
  prayingContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  prayingAura: {
    position: "absolute",
    opacity: 0.6,
  },
  devoteeHead: {
    position: "absolute",
    alignItems: "center",
  },
  hairBun: {
    backgroundColor: "#1C1917",
  },
  face: {
    backgroundColor: "#FED7AA",
    alignItems: "center",
  },
  bindi: {
    position: "absolute",
  },
  namasteHands: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  namastePalm: {
    marginHorizontal: 0.5,
  },
  devoteeTorso: {
    position: "absolute",
    overflow: "hidden",
  },
  shawlBorder: {
    width: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.border,
  },
});
