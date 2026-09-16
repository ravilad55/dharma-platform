import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { getAddresses, CustomerAddress } from "../../src/api/addresses";
import { getErrorMessage } from "../../src/api/errors";
import { useAuthStore } from "../../src/auth/store";
import {
  borderRadius,
  colors,
  DharmaButton,
  EmptyState,
  ErrorState,
  MapPinIcon,
  shadows,
  Skeleton,
  spacing,
} from "../../src/design-system";
import { buildAddressLines } from "../../src/features/orders/addressFormat";
import { useOrderReviewStore } from "../../src/features/orders/orderReviewStore";

function AddressRow({ address, selected, onSelect }: { address: CustomerAddress; selected: boolean; onSelect: () => void }) {
  const lines = buildAddressLines(address);
  return (
    <Pressable
      testID={`address-row-${address.id}`}
      accessibilityRole="radio"
      accessibilityLabel={`${address.label}, Delivery to ${lines[0] ?? ""}`}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.addressLabel} numberOfLines={1}>
            {address.label}
          </Text>
          {address.isDefault ? <Text style={styles.defaultBadge}>Default</Text> : null}
        </View>
        <Text style={styles.addressLine} numberOfLines={2}>
          {lines.join(", ")}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function AddressSkeleton() {
  return (
    <View testID="addresses-loading" style={styles.list}>
      {[0, 1].map((index) => (
        <View key={index} style={styles.card}>
          <Skeleton width="38%" height={16} accessibilityLabel="Loading address label" />
          <Skeleton width="80%" height={14} style={styles.skeletonLine} accessibilityLabel="Loading address line" />
        </View>
      ))}
    </View>
  );
}

export default function AddressSelectScreen() {
  const status = useAuthStore((state) => state.status);
  const selectedAddressId = useOrderReviewStore((state) => state.selectedAddressId);
  const setSelectedAddressId = useOrderReviewStore((state) => state.setSelectedAddressId);

  const addressesQuery = useQuery({ queryKey: ["addresses"], queryFn: getAddresses, enabled: status === "authenticated" });

  const handleSelect = (address: CustomerAddress) => {
    setSelectedAddressId(address.id);
    router.back();
  };

  const renderContent = () => {
    if (addressesQuery.isPending) return <AddressSkeleton />;

    if (addressesQuery.isError) {
      return (
        <ErrorState
          testID="addresses-error"
          title="Unable to load your addresses"
          message={getErrorMessage(addressesQuery.error, "Your saved addresses could not be loaded.")}
          onRetry={() => addressesQuery.refetch()}
        />
      );
    }

    const addresses = addressesQuery.data ?? [];

    if (addresses.length === 0) {
      return (
        <EmptyState
          testID="addresses-empty"
          title="No saved addresses"
          message="Add a delivery address so your pooja samagri can reach you."
          icon={<MapPinIcon size={24} color={colors.primary} />}
          actionLabel="Add Address"
          onAction={() => router.push("/(protected)/address-create")}
        />
      );
    }

    return (
      <FlatList
        testID="addresses-list"
        data={addresses}
        keyExtractor={(address) => address.id}
        renderItem={({ item }) => (
          <AddressRow address={item} selected={item.id === selectedAddressId} onSelect={() => handleSelect(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back to review" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Select Address</Text>
          <View style={styles.headerSpace} />
        </View>
        {renderContent()}
        {addressesQuery.data && addressesQuery.data.length > 0 ? (
          <View style={styles.bottomBar}>
            <DharmaButton title="Add Address" variant="secondary" size="medium" onPress={() => router.push("/(protected)/address-create")} />
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
  headerButton: { width: 40, minHeight: 44, justifyContent: "center" },
  back: { color: colors.text, fontSize: 40, fontWeight: "300", lineHeight: 42 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", fontFamily: "Inter" },
  headerSpace: { width: 40 },
  list: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm, minHeight: 72 },
  cardSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  cardBody: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  addressLabel: { color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter", flexShrink: 1 },
  defaultBadge: { color: colors.saffronDark, fontSize: 11, fontWeight: "700", fontFamily: "Inter", backgroundColor: colors.saffronLight, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, overflow: "hidden" },
  addressLine: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter", marginTop: 2 },
  chevron: { color: colors.textSubtle, fontSize: 26, lineHeight: 28, marginLeft: spacing.sm },
  skeletonLine: { marginTop: spacing.sm },
  bottomBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.warmCream },
});