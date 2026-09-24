import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getErrorMessage } from "../../../src/api/errors";
import { getPandits, panditsPageSize, PanditSummary } from "../../../src/api/pandits";
import { useAuthStore } from "../../../src/auth/store";
import {
  borderRadius,
  colors,
  DharmaSearchBar,
  EmptyState,
  ErrorState,
  MapPinIcon,
  PanditIcon,
  shadows,
  Skeleton,
  spacing,
} from "../../../src/design-system";
import {
  getNextPanditsPageParam,
  panditFilters,
  PanditFilterId,
  serviceParamForFilter,
} from "../../../src/features/pandits/panditFilters";
import { getLocalPanditImage } from "../../../src/features/pandits/panditImages";
import { formatMoney } from "../../../src/utils/money";

export { getNextPanditsPageParam } from "../../../src/features/pandits/panditFilters";

function PanditAvatar({ imageReference }: { imageReference?: string | null }) {
  const localImage = getLocalPanditImage(imageReference);
  if (localImage) return React.createElement(localImage, { width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" });
  if (imageReference) return <Image source={{ uri: imageReference }} style={styles.avatarImage} resizeMode="cover" />;
  return (
    <View style={styles.avatarPlaceholder}>
      <PanditIcon size={30} color={colors.primary} />
    </View>
  );
}

function PanditCard({ pandit, onViewProfile }: { pandit: PanditSummary; onViewProfile: () => void }) {
  const languages = pandit.languages.join(" • ");
  return (
    <View testID={`pandit-card-${pandit.id}`} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatarFrame}>
          <PanditAvatar imageReference={pandit.imageUrl} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={1}>{pandit.displayName}</Text>
          <Text style={styles.experience}>{pandit.experienceYears} years experience</Text>
          <View style={styles.metaRow}>
            <MapPinIcon size={13} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{pandit.city}, {pandit.state}</Text>
          </View>
          {languages ? <Text style={styles.languages} numberOfLines={1}>{languages}</Text> : null}
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {pandit.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({pandit.reviewCount})</Text>
            {pandit.isAvailable ? (
              <Text style={styles.available}>Available</Text>
            ) : (
              <Text style={styles.unavailable}>Currently unavailable</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.serviceInfo}>
          {pandit.primaryServiceName ? <Text style={styles.serviceName} numberOfLines={1}>{pandit.primaryServiceName}</Text> : null}
          {pandit.startingPrice != null ? (
            <Text style={styles.startingPrice}>From {formatMoney(pandit.startingPrice, pandit.currency)}</Text>
          ) : null}
        </View>
        <Pressable
          testID={`view-profile-${pandit.id}`}
          accessibilityRole="button"
          accessibilityLabel={`View profile of ${pandit.displayName}`}
          onPress={onViewProfile}
          style={styles.viewProfileButton}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PanditsSkeleton() {
  return (
    <View testID="pandits-loading" accessibilityLabel="Loading pandits" style={styles.skeletonList}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardTop}>
            <Skeleton width={72} height={72} radius={borderRadius.md} accessibilityLabel="Loading pandit image" />
            <View style={styles.cardInfo}>
              <Skeleton width="70%" height={18} accessibilityLabel="Loading pandit name" />
              <Skeleton width="50%" height={13} style={styles.skeletonLine} accessibilityLabel="Loading experience" />
              <Skeleton width="60%" height={13} style={styles.skeletonLine} accessibilityLabel="Loading location" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function PanditsScreen() {
  const status = useAuthStore((state) => state.status);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PanditFilterId>("all");

  const serviceParam = useMemo(() => serviceParamForFilter(activeFilter), [activeFilter]);
  const trimmedSearch = search.trim();

  const panditsQuery = useInfiniteQuery({
    queryKey: ["pandits", { search: trimmedSearch, service: serviceParam ?? null }],
    queryFn: ({ pageParam = 1 }) =>
      getPandits({ search: trimmedSearch || undefined, service: serviceParam, page: pageParam, pageSize: panditsPageSize }),
    initialPageParam: 1,
    getNextPageParam: getNextPanditsPageParam,
    enabled: status === "authenticated",
  });

  const handleViewProfile = useCallback((panditId: string) => {
    router.push(`/(protected)/pandits/${panditId}`);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setActiveFilter("all");
  }, []);

  const hasActiveFilters = trimmedSearch.length > 0 || activeFilter !== "all";

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  const pages = panditsQuery.data?.pages ?? [];
  const pandits = pages.flatMap((page) => page.items);
  const totalCount = pages[0]?.totalCount ?? 0;

  const renderContent = () => {
    if (panditsQuery.isPending) {
      return <PanditsSkeleton />;
    }

    if (panditsQuery.isError) {
      return (
        <ErrorState
          testID="pandits-error"
          title="Unable to load pandits"
          message={getErrorMessage(panditsQuery.error, "Pandits could not be loaded.")}
          onRetry={() => panditsQuery.refetch()}
        />
      );
    }

    if (totalCount === 0) {
      return (
        <EmptyState
          testID="pandits-empty"
          title="No Pandits found"
          message="Try a different search or clear your filters to see more pandits."
          actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
          icon={<PanditIcon size={26} color={colors.primary} />}
        />
      );
    }

    return (
      <FlatList
        testID="pandits-list"
        data={pandits}
        keyExtractor={(pandit) => pandit.id}
        renderItem={({ item }) => <PanditCard pandit={item} onViewProfile={() => handleViewProfile(item.id)} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (panditsQuery.hasNextPage && !panditsQuery.isFetchingNextPage) {
            void panditsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          panditsQuery.isFetchingNextPage ? (
            <View testID="pandits-loading-more" style={styles.footerLoader}>
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
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Pandits</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.locationRow}>
          <MapPinIcon size={14} color={colors.primary} />
          <Text style={styles.locationText}>Thane, Maharashtra</Text>
        </View>
        <DharmaSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search Pandits or services..."
          onMicPress={() => {}}
          style={styles.search}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.filterScroll}>
          {panditFilters.map((filter) => (
            <Pressable
              key={filter.id}
              testID={`pandit-filter-${filter.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter.id }}
              accessibilityLabel={`Filter by ${filter.label}`}
              onPress={() => setActiveFilter(filter.id)}
              style={[styles.chip, activeFilter === filter.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeFilter === filter.id && styles.chipTextActive]}>{filter.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmCream },
  screen: { flex: 1, paddingHorizontal: spacing.md, backgroundColor: colors.warmCream },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 40 },
  back: { color: colors.text, fontSize: 40, fontWeight: "300", lineHeight: 42 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", fontFamily: "Inter" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingBottom: spacing.sm },
  locationText: { color: colors.textMuted, fontSize: 13, fontWeight: "600", fontFamily: "Inter" },
  search: { marginBottom: spacing.sm, marginHorizontal: 0 },
  filterScroll: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingVertical: spacing.sm },
  chip: { minHeight: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, backgroundColor: colors.warmCreamLight },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontWeight: "600", fontFamily: "Inter" },
  chipTextActive: { color: colors.white },
  list: { gap: spacing.sm, paddingVertical: spacing.sm, paddingBottom: spacing.lg },
  skeletonList: { gap: spacing.sm, paddingVertical: spacing.sm },
  skeletonLine: { marginTop: spacing.sm },
  card: { backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  cardTop: { flexDirection: "row", gap: spacing.md },
  avatarFrame: { width: 72, height: 72, borderRadius: borderRadius.md, overflow: "hidden", backgroundColor: colors.saffronLight },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight },
  cardInfo: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 17, fontWeight: "800", fontFamily: "Inter" },
  experience: { color: colors.textMuted, fontSize: 13, marginTop: 2, fontFamily: "Inter" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 3 },
  metaText: { color: colors.textMuted, fontSize: 13, fontFamily: "Inter", flexShrink: 1 },
  languages: { color: colors.textMuted, fontSize: 12, marginTop: 3, fontFamily: "Inter" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  rating: { color: colors.text, fontSize: 14, fontWeight: "700", fontFamily: "Inter" },
  reviewCount: { color: colors.textMuted, fontSize: 13, fontFamily: "Inter" },
  available: { marginLeft: spacing.xs, color: colors.green, backgroundColor: colors.greenLight, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, fontWeight: "700", fontFamily: "Inter" },
  unavailable: { marginLeft: spacing.xs, color: colors.textMuted, backgroundColor: colors.warmCreamDark, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, fontWeight: "600", fontFamily: "Inter" },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md, gap: spacing.sm },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceName: { color: colors.text, fontSize: 14, fontWeight: "600", fontFamily: "Inter" },
  startingPrice: { color: colors.primary, fontSize: 16, fontWeight: "800", marginTop: 2, fontFamily: "Inter" },
  viewProfileButton: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.full, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  viewProfileText: { color: colors.white, fontSize: 14, fontWeight: "800", fontFamily: "Inter" },
  footerLoader: { paddingVertical: spacing.md, alignItems: "center" },
});
