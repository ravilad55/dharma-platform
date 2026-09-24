import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Pressable } from "react-native";

import { getErrorMessage, getErrorStatus } from "../../../src/api/errors";
import { getPandit, PanditService } from "../../../src/api/pandits";
import { useAuthStore } from "../../../src/auth/store";
import {
  borderRadius,
  ClockIcon,
  colors,
  EmptyState,
  ErrorState,
  MapPinIcon,
  PanditIcon,
  shadows,
  Skeleton,
  spacing,
} from "../../../src/design-system";
import { getLocalPanditImage } from "../../../src/features/pandits/panditImages";
import { formatMoney } from "../../../src/utils/money";

function HeroImage({ imageReference }: { imageReference?: string | null }) {
  const localImage = getLocalPanditImage(imageReference);
  if (localImage) return React.createElement(localImage, { width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" });
  if (imageReference) return <Image source={{ uri: imageReference }} style={styles.heroImage} resizeMode="cover" />;
  return (
    <View style={styles.heroPlaceholder}>
      <PanditIcon size={64} color={colors.primary} />
    </View>
  );
}

function ServiceCard({ service }: { service: PanditService }) {
  const hours = Math.floor(service.durationMinutes / 60);
  const minutes = service.durationMinutes % 60;
  const duration = hours > 0 ? `${hours} hr${hours > 1 ? "s" : ""}${minutes ? ` ${minutes} min` : ""}` : `${minutes} min`;
  return (
    <View testID={`service-card-${service.id}`} style={styles.serviceCard}>
      <Text style={styles.serviceName}>{service.name}</Text>
      {service.description ? <Text style={styles.serviceDescription}>{service.description}</Text> : null}
      <View style={styles.serviceMetaRow}>
        <View style={styles.durationChip}>
          <ClockIcon size={13} color={colors.textMuted} />
          <Text style={styles.durationText}>Duration: {duration}</Text>
        </View>
        <Text style={styles.servicePrice}>From {formatMoney(service.price, service.currency)}</Text>
      </View>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View testID="pandit-detail-loading" accessibilityLabel="Loading pandit profile" style={styles.loadingContainer}>
      <Skeleton width="100%" height={220} radius={0} accessibilityLabel="Loading profile image" />
      <View style={styles.loadingBody}>
        <Skeleton width="60%" height={24} accessibilityLabel="Loading pandit name" />
        <Skeleton width="40%" height={16} style={styles.skeletonLine} accessibilityLabel="Loading rating" />
        <Skeleton width="70%" height={16} style={styles.skeletonLine} accessibilityLabel="Loading location" />
        <Skeleton width="100%" height={80} style={styles.skeletonBlock} accessibilityLabel="Loading description" />
      </View>
    </View>
  );
}

export default function PanditDetailScreen() {
  const status = useAuthStore((state) => state.status);
  const params = useLocalSearchParams<{ panditId: string }>();
  const panditId = Array.isArray(params.panditId) ? params.panditId[0] : params.panditId;

  const panditQuery = useQuery({
    queryKey: ["pandit", panditId],
    queryFn: () => getPandit(panditId!),
    enabled: status === "authenticated" && Boolean(panditId),
    retry: (failureCount, error) => getErrorStatus(error) === 404 ? false : failureCount < 2,
  });

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  const notFound = getErrorStatus(panditQuery.error) === 404;
  const pandit = panditQuery.data;

  const renderContent = () => {
    if (panditQuery.isPending) {
      return <DetailSkeleton />;
    }

    if (notFound) {
      return (
        <EmptyState
          testID="pandit-detail-not-found"
          title="Pandit not found"
          message="This pandit is no longer available. Browse other pandits instead."
          actionLabel="Back to Pandits"
          onAction={() => router.replace("/(protected)/pandits")}
          icon={<PanditIcon size={26} color={colors.primary} />}
        />
      );
    }

    if (panditQuery.isError || !pandit) {
      return (
        <ErrorState
          testID="pandit-detail-error"
          title="Unable to load profile"
          message={getErrorMessage(panditQuery.error, "This pandit's profile could not be loaded.")}
          onRetry={() => panditQuery.refetch()}
        />
      );
    }

    const languages = pandit.languages.join(" • ");

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <HeroImage imageReference={pandit.imageUrl} />
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{pandit.displayName}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {pandit.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({pandit.reviewCount} reviews)</Text>
            {pandit.isAvailable ? (
              <Text style={styles.available}>Available</Text>
            ) : (
              <Text style={styles.unavailable}>Currently unavailable</Text>
            )}
          </View>
          <Text style={styles.experience}>{pandit.experienceYears} years experience</Text>
          <View style={styles.metaRow}>
            <MapPinIcon size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{pandit.city}, {pandit.state}</Text>
          </View>
          {languages ? <Text style={styles.languages}>{languages}</Text> : null}
          {pandit.description ? <Text style={styles.description}>{pandit.description}</Text> : null}

          <Text style={styles.sectionTitle}>Services</Text>
          {pandit.services.length === 0 ? (
            <Text style={styles.noServices}>No services are listed yet.</Text>
          ) : (
            <View style={styles.serviceList}>
              {pandit.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </View>
          )}

          <View testID="booking-next-slice-note" style={styles.bookingNote}>
            <Text style={styles.bookingNoteText}>Booking will be available in the next slice.</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{pandit?.displayName ?? "Pandit"}</Text>
          <View style={styles.headerButton} />
        </View>
        {renderContent()}
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
  scrollContent: { paddingBottom: spacing.xxl },
  hero: { width: "100%", height: 220, backgroundColor: colors.saffronLight, overflow: "hidden" },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  name: { color: colors.text, fontSize: 24, fontWeight: "800", fontFamily: "Inter" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  rating: { color: colors.text, fontSize: 15, fontWeight: "700", fontFamily: "Inter" },
  reviewCount: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter" },
  available: { marginLeft: spacing.xs, color: colors.green, backgroundColor: colors.greenLight, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, fontWeight: "700", fontFamily: "Inter" },
  unavailable: { marginLeft: spacing.xs, color: colors.textMuted, backgroundColor: colors.warmCreamDark, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, fontWeight: "600", fontFamily: "Inter" },
  experience: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm, fontFamily: "Inter" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  metaText: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter" },
  languages: { color: colors.textMuted, fontSize: 14, marginTop: spacing.xs, fontFamily: "Inter" },
  description: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: spacing.md, fontFamily: "Inter" },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.sm, fontFamily: "Inter" },
  noServices: { color: colors.textMuted, fontSize: 14, fontFamily: "Inter" },
  serviceList: { gap: spacing.sm },
  serviceCard: { backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  serviceName: { color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  serviceDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.xs, fontFamily: "Inter" },
  serviceMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  durationChip: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  durationText: { color: colors.textMuted, fontSize: 13, fontFamily: "Inter" },
  servicePrice: { color: colors.primary, fontSize: 16, fontWeight: "800", fontFamily: "Inter" },
  bookingNote: { marginTop: spacing.xl, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  bookingNoteText: { color: colors.primary, fontSize: 14, fontWeight: "700", fontFamily: "Inter", textAlign: "center" },
  loadingContainer: { flex: 1 },
  loadingBody: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  skeletonLine: { marginTop: spacing.sm },
  skeletonBlock: { marginTop: spacing.md },
});
