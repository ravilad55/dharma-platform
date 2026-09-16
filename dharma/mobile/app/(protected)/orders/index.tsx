import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getErrorMessage } from "../../../src/api/errors";
import { getOrders, ordersPageSize, OrderSummary } from "../../../src/api/orders";
import { useAuthStore } from "../../../src/auth/store";
import {
  borderRadius,
  BottomTabBar,
  ChevronRightIcon,
  colors,
  DharmaStatusBadge,
  EmptyState,
  ErrorState,
  OrdersTabIcon,
  shadows,
  Skeleton,
  spacing,
} from "../../../src/design-system";
import { formatOrderDate } from "../../../src/features/orders/orderFormat";
import { getNextOrdersPageParam } from "../../../src/features/orders/orderPagination";
import { getOrderStatusPresentation } from "../../../src/features/orders/orderStatus";
import { useTabNavigation } from "../../../src/hooks/useTabNavigation";
import { formatMoney } from "../../../src/utils/money";

function OrderCard({ order, onPress }: { order: OrderSummary; onPress: () => void }) {
  const status = getOrderStatusPresentation(order.status);

  return (
    <Pressable
      testID={`order-card-${order.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNumber}, ${status.label}, ${formatOrderDate(order.createdAtUtc)}, total ${formatMoney(order.total, order.currency)}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.orderNumber} numberOfLines={1}>
          Order #{order.orderNumber}
        </Text>
        <DharmaStatusBadge label={status.label} tone={status.tone} />
      </View>
      <Text style={styles.orderDate}>{formatOrderDate(order.createdAtUtc)}</Text>
      <View style={styles.cardBottomRow}>
        <Text style={styles.subtotal}>Subtotal {formatMoney(order.subtotal, order.currency)}</Text>
        <View style={styles.totalGroup}>
          <Text style={styles.total}>{formatMoney(order.total, order.currency)}</Text>
          <ChevronRightIcon size={16} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

function OrdersSkeleton() {
  return (
    <View testID="orders-loading" accessibilityLabel="Loading your orders" style={styles.skeletonList}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardTopRow}>
            <Skeleton width="52%" height={16} accessibilityLabel="Loading order number" />
            <Skeleton width={88} height={26} radius={borderRadius.full} accessibilityLabel="Loading order status" />
          </View>
          <Skeleton width="34%" height={13} style={styles.skeletonLine} accessibilityLabel="Loading order date" />
          <Skeleton width="46%" height={18} style={styles.skeletonLine} accessibilityLabel="Loading order total" />
        </View>
      ))}
    </View>
  );
}
/** Pagination helper lives in a route-free module for testability. */
export { getNextOrdersPageParam } from "../../../src/features/orders/orderPagination";

export default function OrdersScreen() {
  const status = useAuthStore((state) => state.status);
  const { onTabPress } = useTabNavigation("orders");

  const ordersQuery = useInfiniteQuery({
    queryKey: ["orders"],
    queryFn: ({ pageParam = 1 }) => getOrders({ page: pageParam, pageSize: ordersPageSize }),
    initialPageParam: 1,
    getNextPageParam: getNextOrdersPageParam,
    enabled: status === "authenticated",
  });

  const handleOpenOrder = useCallback(
    (orderId: string) => {
      router.push(`/(protected)/orders/${orderId}`);
    },
    []
  );

  const handleExploreSamagri = useCallback(() => {
    router.replace("/(protected)/samagri");
  }, []);

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  const pages = ordersQuery.data?.pages ?? [];
  const orders = pages.flatMap((page) => page.items);
  const totalCount = pages[0]?.totalCount ?? 0;
  const isRefreshing = ordersQuery.isRefetching && !ordersQuery.isPending;

  const renderContent = () => {
    if (ordersQuery.isPending) {
      return <OrdersSkeleton />;
    }

    if (ordersQuery.isError) {
      return (
        <ErrorState
          testID="orders-error"
          title="Unable to load your orders"
          message={getErrorMessage(ordersQuery.error, "Your orders could not be loaded.")}
          onRetry={() => ordersQuery.refetch()}
        />
      );
    }

    if (totalCount === 0) {
      return (
        <EmptyState
          testID="orders-empty"
          title="No orders yet"
          message="Your completed and upcoming orders will appear here."
          actionLabel="Explore Pooja Samagri"
          onAction={handleExploreSamagri}
          icon={<OrdersTabIcon size={26} color={colors.primary} />}
        />
      );
    }

    return (
      <FlatList
        testID="orders-list"
        data={orders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => <OrderCard order={item} onPress={() => handleOpenOrder(item.id)} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
            void ordersQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => ordersQuery.refetch()} colors={[colors.primary]} />
        }
        ListFooterComponent={
          ordersQuery.isFetchingNextPage ? (
            <View testID="orders-loading-more" style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerSpace} />
          <Text style={styles.title}>My Orders</Text>
          <View style={styles.headerSpace} />
        </View>
        {renderContent()}
        <BottomTabBar activeTab="orders" onTabPress={onTabPress} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmCream },
  screen: { flex: 1, backgroundColor: colors.warmCream },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  headerSpace: { width: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", fontFamily: "Inter" },
  list: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, paddingBottom: spacing.lg },
  skeletonList: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  skeletonLine: { marginTop: spacing.sm },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  orderNumber: { flex: 1, color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  orderDate: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, fontFamily: "Inter" },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    minHeight: 44,
  },
  subtotal: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter" },
  totalGroup: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  total: { color: colors.primary, fontSize: 19, fontWeight: "800", fontFamily: "Inter" },
  footerLoader: { paddingVertical: spacing.md, alignItems: "center" },
});
