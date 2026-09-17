import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { getOrder, OrderAddress, OrderItem } from "../../../src/api/orders";
import { getErrorMessage, getErrorStatus } from "../../../src/api/errors";
import { useAuthStore } from "../../../src/auth/store";
import {
  borderRadius,
  colors,
  DharmaStatusBadge,
  ErrorState,
  shadows,
  Skeleton,
  spacing,
} from "../../../src/design-system";
import {
  formatCountry,
  formatOrderDate,
  formatQuantityLine,
} from "../../../src/features/orders/orderFormat";
import { getOrderStatusPresentation } from "../../../src/features/orders/orderStatus";
import { formatMoney } from "../../../src/utils/money";

function OrderDetailsSkeleton() {
  return (
    <View testID="order-loading" accessibilityLabel="Loading order details" style={styles.skeletonWrap}>
      <Skeleton width="60%" height={20} accessibilityLabel="Loading order number" />
      <Skeleton width="36%" height={14} style={styles.mtSm} accessibilityLabel="Loading order date" />
      <Skeleton width={110} height={28} radius={borderRadius.full} style={styles.mtSm} accessibilityLabel="Loading order status" />
      <Skeleton width="42%" height={16} style={styles.mtLg} accessibilityLabel="Loading items section" />
      {[0, 1].map((index) => (
        <View key={index} style={[styles.card, styles.mtSm]}>
          <Skeleton width="72%" height={16} accessibilityLabel="Loading product name" />
          <Skeleton width="40%" height={13} style={styles.mtSm} accessibilityLabel="Loading product SKU" />
          <Skeleton width="55%" height={14} style={styles.mtSm} accessibilityLabel="Loading quantity and price" />
        </View>
      ))}
    </View>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <View style={styles.card} testID={`order-item-${item.productId}`}>
      <View style={styles.itemRow}>
        <View style={styles.itemImage} accessibilityRole="image" accessibilityLabel="Order item image placeholder">
          <Text style={styles.itemImageText}>Dharma</Text>
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.itemSku} numberOfLines={1}>
            {item.sku}
          </Text>
          <Text style={styles.itemQty}>{formatQuantityLine(item.quantity, item.unitPrice, item.currency)}</Text>
        </View>
        <Text style={styles.itemTotal}>{formatMoney(item.lineTotal, item.currency)}</Text>
      </View>
    </View>
  );
}

function AddressSection({ address }: { address: OrderAddress }) {
  const lines = [
    address.contactName,
    address.contactPhone,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    formatCountry(address.country),
  ].filter((line): line is string => Boolean(line && line.trim().length > 0));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delivery Address</Text>
      <View style={styles.card}>
        {lines.map((line, index) => (
          <Text key={index} style={index === 0 ? styles.addressName : styles.addressLine}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function OrderDetailsScreen() {
  const status = useAuthStore((state) => state.status);
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const rawOrderId = params.orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId ?? ""),
    enabled: status === "authenticated" && Boolean(orderId),
  });

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  if (!orderId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.screen}>
          <DetailsHeader title="Order Details" />
          <ErrorState testID="order-error" title="Order not found" message="This order could not be found. It may belong to another account." />
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    if (orderQuery.isPending) return <OrderDetailsSkeleton />;
    if (orderQuery.isError) {
      const isNotFound = getErrorStatus(orderQuery.error) === 404;
      return (
        <ErrorState
          testID="order-error"
          title={isNotFound ? "Order not found" : "Unable to load this order"}
          message={
            isNotFound
              ? "This order could not be found. It may belong to another account."
              : getErrorMessage(orderQuery.error, "This order could not be loaded. Please try again.")
          }
          onRetry={() => orderQuery.refetch()}
        />
      );
    }

    const order = orderQuery.data;
    const presentation = getOrderStatusPresentation(order.status);

    return (
      <FlatList
        testID="order-details"
        data={order.items}
        keyExtractor={(item) => `${item.productId}-${item.sku}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.orderHead}>
              <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatOrderDate(order.createdAtUtc)}</Text>
              <View style={styles.badgeRow}>
                <DharmaStatusBadge label={presentation.label} tone={presentation.tone} />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Items</Text>
          </View>
        }
        renderItem={({ item }) => <OrderItemRow item={item} />}
        ListFooterComponent={
          <View>
            <AddressSection address={order.address} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Summary</Text>
              <View style={styles.card}>
                <SummaryRow label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
                <SummaryRow label="Delivery" value={formatMoney(order.deliveryCharge, order.currency)} />
                <SummaryRow label="Service Charge" value={formatMoney(order.serviceCharge, order.currency)} />
                <View style={styles.divider} />
                <SummaryRow label="Total" value={formatMoney(order.total, order.currency)} strong />
              </View>
            </View>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <DetailsHeader title="Order Details" />
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

function DetailsHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back to orders"
        hitSlop={10}
        style={styles.headerButton}
        onPress={() => router.back()}
      >
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.headerSpace} />
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
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmCream },
  screen: { flex: 1, backgroundColor: colors.warmCream },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  headerButton: { width: 40, minHeight: 44, justifyContent: "center" },
  back: { color: colors.text, fontSize: 40, fontWeight: "300", lineHeight: 42 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", fontFamily: "Inter" },
  headerSpace: { width: 40 },
  list: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  orderHead: { paddingVertical: spacing.sm },
  orderNumber: { color: colors.text, fontSize: 20, fontWeight: "800", fontFamily: "Inter" },
  orderDate: { color: colors.textMuted, fontSize: 14, marginTop: spacing.xs, fontFamily: "Inter" },
  badgeRow: { marginTop: spacing.sm, flexDirection: "row" },
  section: { marginTop: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800", fontFamily: "Inter", marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  itemImage: { width: 56, height: 64, borderRadius: borderRadius.md, backgroundColor: colors.warmCreamDark, alignItems: "center", justifyContent: "center" },
  itemImageText: { color: colors.primary, fontSize: 12, fontWeight: "800", fontFamily: "Inter" },
  itemContent: { flex: 1, minWidth: 0 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  itemSku: { color: colors.textMuted, fontSize: 13, marginTop: 2, fontFamily: "Inter" },
  itemQty: { color: colors.textMuted, fontSize: 14, marginTop: spacing.xs, fontFamily: "Inter" },
  itemTotal: { color: colors.primary, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  addressName: { color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  addressLine: { color: colors.text, fontSize: 15, marginTop: 2, fontFamily: "Inter" },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs, minHeight: 44 },
  summaryLabel: { color: colors.textMuted, fontSize: 15, fontFamily: "Inter" },
  summaryValue: { color: colors.text, fontSize: 15, fontWeight: "700", fontFamily: "Inter" },
  summaryStrong: { color: colors.text, fontSize: 17, fontWeight: "800" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  skeletonWrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 0 },
  mtSm: { marginTop: spacing.sm },
  mtLg: { marginTop: spacing.lg },
});

