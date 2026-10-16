import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../../../src/auth/store";
import {
  borderRadius,
  colors,
  EmptyState,
  PanditIcon,
  shadows,
  spacing,
} from "../../../src/design-system";
import { buildSelectableDates } from "../../../src/features/pandits/availabilityDates";
import { useServiceSelectionStore } from "../../../src/features/pandits/serviceSelectionStore";
import { formatMoney } from "../../../src/utils/money";

/**
 * Step 3 of the booking flow (BOOKING-03): pick a date. No times are fetched yet and no booking is
 * created. The chosen date is retained in the selection store and carried to the Available Times
 * screen.
 */
export default function SelectDateScreen() {
  const status = useAuthStore((state) => state.status);
  const selected = useServiceSelectionStore((state) => state.selected);
  const selectedDate = useServiceSelectionStore((state) => state.selectedDate);
  const selectDate = useServiceSelectionStore((state) => state.selectDate);

  const dates = useMemo(() => buildSelectableDates(14), []);
  const [localDate, setLocalDate] = useState<string | null>(selectedDate);

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  const handleContinue = () => {
    if (!localDate) return;
    selectDate(localDate);
    router.push("/(protected)/pandits/available-times");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Select Date</Text>
          <View style={styles.headerButton} />
        </View>

        {selected ? (
          <>
            <View testID="selected-service-banner" style={styles.banner}>
              <View style={styles.bannerRow}>
                <PanditIcon size={16} color={colors.primary} />
                <Text style={styles.bannerPandit}>{selected.panditName}</Text>
              </View>
              <Text style={styles.bannerService}>{selected.serviceName}</Text>
              <Text style={styles.bannerPrice}>From {formatMoney(selected.price, selected.currency)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Choose a date</Text>
            <ScrollView contentContainerStyle={styles.dateGrid} showsVerticalScrollIndicator={false}>
              {dates.map((d) => {
                const active = localDate === d.value;
                return (
                  <Pressable
                    key={d.value}
                    testID={`date-${d.value}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${d.weekday} ${d.day} ${d.month}`}
                    onPress={() => setLocalDate(d.value)}
                    style={[styles.dateCard, active && styles.dateCardActive]}
                  >
                    <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>{d.weekday}</Text>
                    <Text style={[styles.dateDay, active && styles.dateTextActive]}>{d.day}</Text>
                    <Text style={[styles.dateMonth, active && styles.dateTextActive]}>{d.month}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                testID="date-continue-button"
                accessibilityRole="button"
                accessibilityState={{ disabled: !localDate }}
                accessibilityLabel="Continue to available times"
                onPress={handleContinue}
                disabled={!localDate}
                style={[styles.continueButton, !localDate && styles.continueButtonDisabled]}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <EmptyState
            testID="no-service-selected"
            title="No service selected"
            message="Choose a service on a pandit's profile first."
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
  banner: { marginHorizontal: spacing.md, backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  bannerPandit: { color: colors.textMuted, fontSize: 13, fontWeight: "600", fontFamily: "Inter" },
  bannerService: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 2, fontFamily: "Inter" },
  bannerPrice: { color: colors.primary, fontSize: 15, fontWeight: "800", marginTop: 2, fontFamily: "Inter" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800", paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm, fontFamily: "Inter" },
  dateGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  dateCard: { width: 72, paddingVertical: spacing.md, alignItems: "center", borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardBackground },
  dateCardActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  dateWeekday: { color: colors.textMuted, fontSize: 12, fontWeight: "600", fontFamily: "Inter" },
  dateDay: { color: colors.text, fontSize: 20, fontWeight: "800", marginVertical: 2, fontFamily: "Inter" },
  dateMonth: { color: colors.textMuted, fontSize: 12, fontWeight: "600", fontFamily: "Inter" },
  dateTextActive: { color: colors.primary },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  continueButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.full, backgroundColor: colors.primary, ...shadows.sm },
  continueButtonDisabled: { backgroundColor: colors.textSubtle },
  continueButtonText: { color: colors.white, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
});
