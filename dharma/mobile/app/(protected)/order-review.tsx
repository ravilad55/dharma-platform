import React, { useRef } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAddresses, CustomerAddress } from "../../src/api/addresses";
import { CartItem, getCart } from "../../src/api/cart";
import { getErrorStatus } from "../../src/api/errors";
import { createOrder } from "../../src/api/orders";
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
import { getOrderCreateErrorMessage, selectPreferredAddress } from "../../src/features/orders/orderReview";
import { useOrderReviewStore } from "../../src/features/orders/orderReviewStore";
import { getLocalProductImage } from "../../src/features/samagri/productImages";
import { formatMoney } from "../../src/utils/money";
import { generateIdempotencyKey } from "../../src/utils/idempotencyKey";

function ReviewItemRow({ item, currency }: { item: CartItem; currency: string }) {
  const LocalImage = getLocalProductImage(item.imageUrl);
  return (
    <View style={styles.itemCard} testID={`review-item-${item.id}`}>
      <View style={styles.itemImage}>
        {LocalImage ? (
          <LocalImage width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        ) : item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImageUri} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>Dharma</Text>
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemQty}>
          Qty {item.quantity} × {formatMoney(item.unitPrice, currency)}
        </Text>
        <Text style={styles.itemTotal}>{formatMoney(item.subtotal, currency)}</Text>
      </View>
    </View>
  );
}

function AddressCard({ address, onChangeLabel, onChange }: { address: CustomerAddress; onChangeLabel: string; onChange: () => void }) {
  const lines = buildAddressLines(address);
  return (
    <View style={styles.card}>
      <View style={styles.addressHeader}>
        <View style={styles.addressHeaderLeft}>
          <MapPinIcon size={18} color={colors.primary} />
          {address.label ? (
            <Text style={styles.addressLabel} numberOfLines={1}>
              {address.label}
            </Text>
          ) : null}
          {address.isDefault ? <Text style={styles.defaultBadge}>Default</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={onChangeLabel}
          hitSlop={8}
          onPress={onChange}
          style={styles.changeButton}
        >
          <Text style={styles.changeText}>{onChangeLabel}</Text>
        </Pressable>
      </View>
      {lines.map((line, index) => (
        <Text key={index} style={index === 0 ? styles.addressName : styles.addressLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function PriceSummary({ subtotal, delivery, serviceCharge, total, currency }: { subtotal: number; delivery: number; serviceCharge: number; total: number; currency: string }) {
  return (
    <View style={styles.summaryCard}>
      <SummaryRow label="Subtotal" value={formatMoney(subtotal, currency)} />
      <SummaryRow label="Delivery" value={formatMoney(delivery, currency)} />
      <SummaryRow label="Service Charge" value={formatMoney(serviceCharge, currency)} />
      <View style={styles.divider} />
      <SummaryRow label="Total" value={formatMoney(total, currency)} strong />
    </View>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

export default function OrderReviewScreen() {
  const insets = useSafeAreaInsets();
  const status = useAuthStore((state) => state.status);
  const queryClient = useQueryClient();
  const selectedAddressId = useOrderReviewStore((state) => state.selectedAddressId);
  const setSelectedAddressId = useOrderReviewStore((state) => state.setSelectedAddressId);

  const cartQuery = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: status === "authenticated" });
  const addressesQuery = useQuery({ queryKey: ["addresses"], queryFn: getAddresses, enabled: status === "authenticated" });

  // One idempotency key per logical submission: generated only when placing an
  // order, retained across a failed attempt (so a retry reuses it), and cleared
  // only after a successful order is created.
  const placeOrderKeyRef = useRef<string | null>(null);

  const placeOrder = useMutation({
    mutationFn: async (addressId: string) => {
      placeOrderKeyRef.current ??= generateIdempotencyKey();
      return createOrder({ addressId }, placeOrderKeyRef.current);
    },
    onSuccess: async (order) => {
      placeOrderKeyRef.current = null;
      setSelectedAddressId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
      router.replace(`/(protected)/orders/${order.id}`);
    },
    onError: (error) => {
      // A stale cart should be refetched so the user reviews current server prices.
      if (getErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
    },
  });

  const addresses = addressesQuery.data ?? [];
  const selectedAddress = selectPreferredAddress(addresses, selectedAddressId);
  const cartData = cartQuery.data;
  const hasInvalidItems = cartData?.items.some((item) => !item.available) ?? false;
  const isEmptyCart = (cartData?.items.length ?? 0) === 0;

  const canPlaceOrder =
    Boolean(selectedAddress) &&
    !isEmptyCart &&
    !hasInvalidItems &&
    !cartQuery.isPending &&
    !cartQuery.isError &&
    !addressesQuery.isPending &&
    !addressesQuery.isError &&
    !placeOrder.isPending;

  const handlePlaceOrder = () => {
    if (!canPlaceOrder || !selectedAddress) return;
    placeOrder.mutate(selectedAddress.id);
  };

  const renderAddress = () => {
    if (addressesQuery.isPending) {
      return (
        <View style={styles.card} testID="review-address-loading">
          <Skeleton width="40%" height={16} accessibilityLabel="Loading address label" />
          <Skeleton width="70%" height={14} style={styles.skeletonLine} accessibilityLabel="Loading address line" />
          <Skeleton width="55%" height={14} style={styles.skeletonLine} accessibilityLabel="Loading address line" />
          <Skeleton width="45%" height={14} style={styles.skeletonLine} accessibilityLabel="Loading address line" />
        </View>
      );
    }
    if (addressesQuery.isError) {
      return (
        <ErrorState
          testID="review-address-error"
          title="Unable to load your addresses"
          message="Your saved delivery addresses could not be loaded."
          onRetry={() => addressesQuery.refetch()}
        />
      );
    }
    if (!selectedAddress) {
      return (
        <View style={[styles.card, styles.noAddressCard]} testID="review-no-address">
          <Text style={styles.noAddressTitle}>No delivery address</Text>
          <Text style={styles.noAddressText}>Add a delivery address so we know where to send your pooja samagri.</Text>
          <DharmaButton title="Add Address" variant="outline" size="medium" onPress={() => router.push("/(protected)/address-create")} />
        </View>
      );
    }
    return <AddressCard address={selectedAddress} onChangeLabel="Change Address" onChange={() => router.push("/(protected)/address-select")} />;
  };

  const renderItems = () => {
    if (cartQuery.isPending) {
      return (
        <View>
          <Skeleton width={120} height={17} accessibilityLabel="Loading items section" />
          {[0, 1].map((index) => (
            <View key={index} style={[styles.itemCard, styles.skeletonLine]}>
              <Skeleton width={56} height={64} radius={borderRadius.md} accessibilityLabel="Loading product image" />
              <View style={styles.itemContent}>
                <Skeleton width="75%" height={16} accessibilityLabel="Loading product name" />
                <Skeleton width="45%" height={13} style={styles.skeletonLine} accessibilityLabel="Loading quantity" />
              </View>
            </View>
          ))}
        </View>
      );
    }
    return cartData?.items.map((item) => <ReviewItemRow key={item.id} item={item} currency={cartData.currency} />) ?? null;
  };

  const renderContent = () => {
    if (cartQuery.isError) {
      return (
        <ErrorState
          testID="review-cart-error"
          title="Unable to load your cart"
          message="Your cart could not be loaded right now."
          onRetry={() => cartQuery.refetch()}
        />
      );
    }
    if (isEmptyCart && !cartQuery.isPending) {
      return (
        <EmptyState
          testID="review-empty-cart"
          title="Your cart is empty"
          message="Add sacred essentials for your next pooja before placing an order."
          actionLabel="Explore Pooja Samagri"
          onAction={() => router.replace("/(protected)/samagri")}
          icon={<MapPinIcon size={24} color={colors.primary} />}
        />
      );
    }
    return (
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing.lg) + 88 }]}
        showsVerticalScrollIndicator={false}
        testID="review-content"
      >
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {renderAddress()}

        <Text style={styles.sectionTitle}>Items</Text>
        {renderItems()}

        <Text style={styles.sectionTitle}>Price Summary</Text>
        <PriceSummary
          subtotal={cartData?.subtotal ?? 0}
          delivery={cartData?.deliveryCharge ?? 0}
          serviceCharge={cartData?.serviceCharge ?? 0}
          total={cartData?.total ?? 0}
          currency={cartData?.currency ?? "INR"}
        />

        {hasInvalidItems ? (
          <View style={styles.invalidNotice} testID="review-invalid-items">
            <Text style={styles.invalidNoticeText}>
              Some items are currently unavailable. Please review your cart before placing the order.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back to cart" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Review Order</Text>
          <View style={styles.headerSpace} />
        </View>

        {renderContent()}

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {placeOrder.isError ? (
            <Text style={styles.error} testID="review-order-error">
              {getOrderCreateErrorMessage(placeOrder.error)}
            </Text>
          ) : null}
          <DharmaButton
            title="Place Order"
            testID="place-order"
            loading={placeOrder.isPending}
            disabled={!canPlaceOrder}
            onPress={handlePlaceOrder}
          />
        </View>
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
  scrollContent: { paddingHorizontal: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800", fontFamily: "Inter", marginTop: spacing.md, marginBottom: spacing.sm },
  card: { backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  addressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  addressHeaderLeft: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  addressLabel: { color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter", flexShrink: 1 },
  defaultBadge: { color: colors.saffronDark, fontSize: 12, fontWeight: "700", fontFamily: "Inter", backgroundColor: colors.saffronLight, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, overflow: "hidden" },
  changeButton: { minHeight: 44, justifyContent: "center", paddingLeft: spacing.md },
  changeText: { color: colors.primary, fontSize: 15, fontWeight: "700", fontFamily: "Inter" },
  addressName: { color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  addressLine: { color: colors.text, fontSize: 15, marginTop: 2, fontFamily: "Inter" },
  noAddressCard: { alignItems: "flex-start" },
  noAddressTitle: { color: colors.text, fontSize: 17, fontWeight: "800", fontFamily: "Inter" },
  noAddressText: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter", marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 20 },
  itemCard: { flexDirection: "row", padding: spacing.sm, backgroundColor: colors.white, borderRadius: borderRadius.lg, ...shadows.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  itemImage: { width: 56, height: 64, borderRadius: borderRadius.md, overflow: "hidden", backgroundColor: colors.warmCreamDark, alignItems: "center", justifyContent: "center" },
  itemImageUri: { width: "100%", height: "100%" },
  placeholder: { color: colors.primary, fontWeight: "800", fontFamily: "Inter" },
  itemContent: { flex: 1, minWidth: 0, paddingLeft: spacing.md, justifyContent: "center" },
  itemName: { color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  itemQty: { color: colors.textMuted, fontSize: 14, marginTop: 2, fontFamily: "Inter" },
  itemTotal: { color: colors.primary, fontSize: 16, fontWeight: "800", fontFamily: "Inter", marginTop: spacing.xs },
  summaryCard: { backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs, minHeight: 44 },
  summaryLabel: { color: colors.textMuted, fontSize: 15, fontFamily: "Inter" },
  summaryValue: { color: colors.text, fontSize: 15, fontWeight: "700", fontFamily: "Inter" },
  summaryStrong: { color: colors.text, fontSize: 17, fontWeight: "800", fontFamily: "Inter" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  skeletonLine: { marginTop: spacing.sm },
  invalidNotice: { backgroundColor: colors.errorLight, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md },
  invalidNoticeText: { color: colors.error, fontSize: 14, fontWeight: "700", fontFamily: "Inter" },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.warmCream, borderTopWidth: 1, borderTopColor: colors.border },
  error: { color: colors.error, fontSize: 14, fontWeight: "700", fontFamily: "Inter", marginBottom: spacing.sm, textAlign: "center" },
});
