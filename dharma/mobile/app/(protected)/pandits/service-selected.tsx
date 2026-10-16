import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../../../src/auth/store";
import {
  borderRadius,
  CheckmarkIcon,
  ClockIcon,
  colors,
  EmptyState,
  PanditIcon,
  shadows,
  spacing,
} from "../../../src/design-system";
import { useServiceSelectionStore } from "../../../src/features/pandits/serviceSelectionStore";
import { formatDurationLabel } from "../../../src/features/pandits/serviceFormat";
import { formatMoney } from "../../../src/utils/money";

/**
 * Confirmation of the selected Pandit service (BOOKING-02). This is the "continue" destination that
 * proves the selection is retained across navigation. It intentionally creates NO booking and offers
 * NO date/slot/payment — those arrive in a later slice.
 */
export default function ServiceSelectedScreen() {
  const status = useAuthStore((state) => state.status);
  const selected = useServiceSelectionStore((state) => state.selected);

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Selected Service</Text>
          <View style={styles.headerButton} />
        </View>

        {selected ? (
          <View style={styles.body}>
            <View style={styles.confirmIcon}>
              <CheckmarkIcon size={28} color={colors.green} />
            </View>
            <Text style={styles.title}>Service selected</Text>
            <Text style={styles.subtitle}>Review your selection below.</Text>

            <View testID="selected-service-summary" style={styles.card}>
              <View style={styles.panditRow}>
                <PanditIcon size={18} color={colors.primary} />
                <Text style={styles.panditName}>{selected.panditName}</Text>
              </View>
              <Text style={styles.serviceName}>{selected.serviceName}</Text>
              <View style={styles.metaRow}>
                <View style={styles.durationChip}>
                  <ClockIcon size={13} color={colors.textMuted} />
                  <Text style={styles.durationText}>Duration: {formatDurationLabel(selected.durationMinutes)}</Text>
                </View>
                <Text style={styles.price}>From {formatMoney(selected.price, selected.currency)}</Text>
              </View>
            </View>

            <View testID="booking-next-slice-note" style={styles.note}>
              <Text style={styles.noteText}>Date selection and booking will be available in the next slice.</Text>
            </View>

            <Pressable
              testID="change-service-button"
              accessibilityRole="button"
              accessibilityLabel="Change service"
              onPress={() => router.back()}
              style={styles.changeButton}
            >
              <Text style={styles.changeButtonText}>Change Service</Text>
            </Pressable>
          </View>
        ) : (
          <EmptyState
            testID="no-service-selected"
            title="No service selected"
            message="Open a pandit's profile and choose a service to continue."
            actionLabel="Browse Pandits"
            onAction={() => router.replace("/(protected)/pandits")}
            icon={<PanditIcon size={26} color={colors.primary} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmCream },
  screen: { flex: 1, backgroundColor: colors.warmCream },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  headerButton: { width: 40 },
  back: { color: colors.text, fontSize: 40, fontWeight: "300", lineHeight: 42 },
  headerTitle: { flex: 1, textAlign: "center", color: colors.text, fontSize: 18, fontWeight: "800", fontFamily: "Inter" },
  body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  confirmIcon: { alignSelf: "center", width: 56, height: 56, borderRadius: 28, backgroundColor: colors.greenLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  title: { textAlign: "center", color: colors.text, fontSize: 22, fontWeight: "800", fontFamily: "Inter" },
  subtitle: { textAlign: "center", color: colors.textMuted, fontSize: 14, marginTop: spacing.xs, fontFamily: "Inter" },
  card: { marginTop: spacing.lg, backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  panditRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  panditName: { color: colors.textMuted, fontSize: 13, fontWeight: "600", fontFamily: "Inter" },
  serviceName: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: spacing.xs, fontFamily: "Inter" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  durationChip: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  durationText: { color: colors.textMuted, fontSize: 13, fontFamily: "Inter" },
  price: { color: colors.primary, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  note: { marginTop: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  noteText: { color: colors.primary, fontSize: 14, fontWeight: "700", fontFamily: "Inter", textAlign: "center" },
  changeButton: { marginTop: spacing.lg, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.primary },
  changeButtonText: { color: colors.primary, fontSize: 15, fontWeight: "800", fontFamily: "Inter" },
});
