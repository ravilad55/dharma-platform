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
import { formatDateHeading, formatSlotTime } from "../../../src/features/pandits/availabilityDates";
import { useServiceSelectionStore } from "../../../src/features/pandits/serviceSelectionStore";
import { formatDurationLabel } from "../../../src/features/pandits/serviceFormat";
import { formatMoney } from "../../../src/utils/money";

/**
 * Confirmation of the full selection (BOOKING-03): pandit, service, date and time. This proves the
 * selection is retained across the flow. It creates NO booking and has no payment — only a note that
 * booking will be available in a later slice.
 */
export default function TimeSelectedScreen() {
  const status = useAuthStore((state) => state.status);
  const selected = useServiceSelectionStore((state) => state.selected);
  const selectedDate = useServiceSelectionStore((state) => state.selectedDate);
  const selectedSlot = useServiceSelectionStore((state) => state.selectedSlot);

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  const complete = Boolean(selected && selectedDate && selectedSlot);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Selected Time</Text>
          <View style={styles.headerButton} />
        </View>

        {complete ? (
          <View style={styles.body}>
            <View style={styles.confirmIcon}>
              <CheckmarkIcon size={28} color={colors.green} />
            </View>
            <Text style={styles.title}>Time selected</Text>
            <Text style={styles.subtitle}>Review your selection below.</Text>

            <View testID="selection-summary" style={styles.card}>
              <View style={styles.panditRow}>
                <PanditIcon size={18} color={colors.primary} />
                <Text style={styles.panditName}>{selected!.panditName}</Text>
              </View>
              <Text style={styles.serviceName}>{selected!.serviceName}</Text>
              <View style={styles.metaRow}>
                <View style={styles.chip}>
                  <ClockIcon size={13} color={colors.textMuted} />
                  <Text style={styles.chipText}>{formatDurationLabel(selected!.durationMinutes)}</Text>
                </View>
                <Text style={styles.price}>From {formatMoney(selected!.price, selected!.currency)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.whenRow}>
                <Text style={styles.whenLabel}>Date</Text>
                <Text testID="summary-date" style={styles.whenValue}>{formatDateHeading(selectedDate!)}</Text>
              </View>
              <View style={styles.whenRow}>
                <Text style={styles.whenLabel}>Time</Text>
                <Text testID="summary-time" style={styles.whenValue}>{formatSlotTime(selectedSlot!.startAt)} – {formatSlotTime(selectedSlot!.endAt)}</Text>
              </View>
            </View>

            <View testID="booking-next-slice-note" style={styles.note}>
              <Text style={styles.noteText}>Booking and payment will be available in the next slice.</Text>
            </View>

            <Pressable
              testID="change-time-button"
              accessibilityRole="button"
              accessibilityLabel="Change time"
              onPress={() => router.back()}
              style={styles.changeButton}
            >
              <Text style={styles.changeButtonText}>Change Time</Text>
            </Pressable>
          </View>
        ) : (
          <EmptyState
            testID="incomplete-selection"
            title="Selection incomplete"
            message="Choose a service, date and time to continue."
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
  chip: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  chipText: { color: colors.textMuted, fontSize: 13, fontFamily: "Inter" },
  price: { color: colors.primary, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  whenRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs },
  whenLabel: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter" },
  whenValue: { color: colors.text, fontSize: 15, fontWeight: "700", fontFamily: "Inter" },
  note: { marginTop: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  noteText: { color: colors.primary, fontSize: 14, fontWeight: "700", fontFamily: "Inter", textAlign: "center" },
  changeButton: { marginTop: spacing.lg, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.primary },
  changeButtonText: { color: colors.primary, fontSize: 15, fontWeight: "800", fontFamily: "Inter" },
});
