import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { getErrorMessage } from "../../../src/api/errors";
import { AvailabilitySlot, getAvailability } from "../../../src/api/pandits";
import { useAuthStore } from "../../../src/auth/store";
import {
  borderRadius,
  colors,
  EmptyState,
  ErrorState,
  PanditIcon,
  shadows,
  Skeleton,
  spacing,
} from "../../../src/design-system";
import { formatDateHeading, formatSlotTime } from "../../../src/features/pandits/availabilityDates";
import { useServiceSelectionStore } from "../../../src/features/pandits/serviceSelectionStore";

function SlotsSkeleton() {
  return (
    <View testID="times-loading" accessibilityLabel="Loading available times" style={styles.grid}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} width={100} height={48} radius={borderRadius.md} accessibilityLabel="Loading time slot" />
      ))}
    </View>
  );
}

/**
 * Step 4 of the booking flow (BOOKING-03): show available times for the selected pandit/service/date
 * and let the customer select one. Only Available slots are selectable; Held/Booked/Blocked are shown
 * disabled. The chosen slot is retained in the store. NO booking is created here.
 */
export default function AvailableTimesScreen() {
  const status = useAuthStore((state) => state.status);
  const selected = useServiceSelectionStore((state) => state.selected);
  const selectedDate = useServiceSelectionStore((state) => state.selectedDate);
  const selectedSlot = useServiceSelectionStore((state) => state.selectedSlot);
  const selectSlot = useServiceSelectionStore((state) => state.selectSlot);

  const [localSlotId, setLocalSlotId] = useState<string | null>(selectedSlot?.slotId ?? null);

  const availabilityQuery = useQuery({
    queryKey: ["availability", selected?.panditId, selected?.serviceId, selectedDate],
    queryFn: () => getAvailability({ panditId: selected!.panditId, serviceId: selected!.serviceId, date: selectedDate! }),
    enabled: status === "authenticated" && Boolean(selected) && Boolean(selectedDate),
  });

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  if (!selected || !selectedDate) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.screen}>
          <EmptyState
            testID="no-date-selected"
            title="Select a date first"
            message="Choose a service and date to see available times."
            actionLabel="Browse Pandits"
            onAction={() => router.replace("/(protected)/pandits")}
            icon={<PanditIcon size={26} color={colors.primary} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handlePick = (slot: AvailabilitySlot) => {
    if (slot.status !== "Available") return;
    setLocalSlotId(slot.id);
  };

  const handleContinue = () => {
    const slots = availabilityQuery.data?.slots ?? [];
    const chosen = slots.find((slot) => slot.id === localSlotId);
    if (!chosen) return;
    selectSlot({ slotId: chosen.id, startAt: chosen.startAt, endAt: chosen.endAt });
    router.push("/(protected)/pandits/time-selected");
  };

  const renderContent = () => {
    if (availabilityQuery.isPending) {
      return <SlotsSkeleton />;
    }

    if (availabilityQuery.isError) {
      return (
        <ErrorState
          testID="times-error"
          title="Unable to load times"
          message={getErrorMessage(availabilityQuery.error, "Available times could not be loaded.")}
          onRetry={() => availabilityQuery.refetch()}
        />
      );
    }

    const slots = availabilityQuery.data?.slots ?? [];
    const availableCount = slots.filter((slot) => slot.status === "Available").length;

    if (slots.length === 0 || availableCount === 0) {
      return (
        <EmptyState
          testID="times-empty"
          title="No times available"
          message="There are no open slots on this date. Try another date."
          actionLabel="Change Date"
          onAction={() => router.back()}
          icon={<PanditIcon size={26} color={colors.primary} />}
        />
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{formatDateHeading(selectedDate)}</Text>
        <Text style={styles.subHeading}>Times shown in {availabilityQuery.data?.timezone ?? "local time"}</Text>
        <View testID="times-list" style={styles.grid}>
          {slots.map((slot) => {
            const isAvailable = slot.status === "Available";
            const active = localSlotId === slot.id;
            return (
              <Pressable
                key={slot.id}
                testID={`slot-${slot.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: !isAvailable }}
                accessibilityLabel={`${formatSlotTime(slot.startAt)}${isAvailable ? "" : `, ${slot.status.toLowerCase()}`}`}
                onPress={() => handlePick(slot)}
                disabled={!isAvailable}
                style={[styles.slot, active && styles.slotActive, !isAvailable && styles.slotDisabled]}
              >
                <Text style={[styles.slotTime, active && styles.slotTimeActive, !isAvailable && styles.slotTimeDisabled]}>
                  {formatSlotTime(slot.startAt)}
                </Text>
                {!isAvailable ? <Text style={styles.slotStatus}>{slot.status}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const canContinue = Boolean(localSlotId);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Available Times</Text>
          <View style={styles.headerButton} />
        </View>
        {renderContent()}
        {canContinue ? (
          <View style={styles.footer}>
            <Pressable
              testID="time-continue-button"
              accessibilityRole="button"
              accessibilityLabel="Continue with selected time"
              onPress={handleContinue}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}
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
  scroll: { padding: spacing.md },
  heading: { color: colors.text, fontSize: 18, fontWeight: "800", fontFamily: "Inter" },
  subHeading: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: spacing.md, fontFamily: "Inter" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.md },
  slot: { minWidth: 100, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: "center", borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardBackground },
  slotActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  slotDisabled: { backgroundColor: colors.warmCreamDark, borderColor: colors.border, opacity: 0.6 },
  slotTime: { color: colors.text, fontSize: 15, fontWeight: "700", fontFamily: "Inter" },
  slotTimeActive: { color: colors.primary },
  slotTimeDisabled: { color: colors.textSubtle },
  slotStatus: { color: colors.textSubtle, fontSize: 11, marginTop: 2, fontFamily: "Inter" },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  continueButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.full, backgroundColor: colors.primary, ...shadows.sm },
  continueButtonText: { color: colors.white, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
});
