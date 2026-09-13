import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { borderRadius, colors, shadows, spacing } from "./tokens";
import {
  BellIcon,
  BookingsTabIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DeliveryIcon,
  HomeTabIcon,
  MapPinIcon,
  MicIcon,
  NotificationsTabIcon,
  OrdersTabIcon,
  PanditIcon,
  ProfileTabIcon,
  RestaurantIcon,
  SamagriIcon,
  SearchIcon,
} from "./icons";
import { TempleIllustration } from "./OnboardingComponents";

/**
 * Location Selector on top left of Home
 */
export interface LocationSelectorProps {
  location?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function LocationSelector({
  location = "Thane, Maharashtra",
  onPress,
  style,
}: LocationSelectorProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Current location: ${location}. Tap to change location.`}
      onPress={onPress}
      style={[styles.locationContainer, style]}
    >
      <MapPinIcon size={16} color={colors.primary} />
      <Text style={styles.locationText} numberOfLines={1}>
        {location}
      </Text>
      <ChevronDownIcon size={12} color={colors.primary} />
    </Pressable>
  );
}

/**
 * Notification Button on top right of Home
 */
export interface NotificationButtonProps {
  unreadCount?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function NotificationButton({
  unreadCount = 2,
  onPress,
  style,
}: NotificationButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Notifications, ${unreadCount} unread`}
      onPress={onPress}
      style={[styles.notificationButton, style]}
    >
      <BellIcon size={20} color={colors.text} />
      {unreadCount > 0 ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Top Home Header row containing Location and Notifications
 */
export function HomeHeader({
  location = "Thane, Maharashtra",
  unreadCount = 2,
  onLocationPress,
  onNotificationPress,
}: {
  location?: string;
  unreadCount?: number;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
}) {
  return (
    <View style={styles.homeHeaderRow}>
      <LocationSelector location={location} onPress={onLocationPress} />
      <NotificationButton unreadCount={unreadCount} onPress={onNotificationPress} />
    </View>
  );
}

/**
 * Hero Greeting Banner with Spiritual Temple & Diya Artwork
 */
export function HomeGreeting({
  displayName,
  onArtPress,
}: {
  displayName?: string | null;
  onArtPress?: () => void;
}) {
  const name = displayName?.trim() || "Devotee";

  return (
    <View style={styles.greetingHeroContainer}>
      <View style={styles.greetingTextSection}>
        <Text style={styles.greetingTitle}>
          Namaste, {name} 🙏
        </Text>
        <Text style={styles.greetingSubtitle}>
          What would you like{"\n"}to do today?
        </Text>
      </View>

      <Pressable
        onPress={onArtPress}
        style={styles.greetingArtSection}
        accessibilityLabel="Dharma spiritual temple illustration"
      >
        <View style={styles.heroAuraGlow} />
        {/* Warm saffron decorative temple art matching reference */}
        <View style={styles.heroTempleArtWrapper}>
          <TempleIllustration size={85} />
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Dharma Search Bar Component
 */
export interface DharmaSearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onMicPress?: () => void;
  onSubmit?: () => void;
  style?: ViewStyle;
}

export function DharmaSearchBar({
  value,
  onChangeText,
  placeholder = "Search Dharma...",
  onMicPress,
  onSubmit,
  style,
}: DharmaSearchBarProps) {
  return (
    <View style={[styles.searchBarContainer, style]}>
      <SearchIcon size={18} color={colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        accessibilityLabel="Search Dharma services and products"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voice search"
        onPress={onMicPress}
        style={styles.micButton}
        hitSlop={8}
      >
        <MicIcon size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

/**
 * Explore Services 4-Card Grid
 */
export interface ServiceCardItem {
  id: "pandits" | "samagri" | "restaurants" | "delivery";
  title: string;
  bgTint: string;
}

const DEFAULT_SERVICES: ServiceCardItem[] = [
  { id: "pandits", title: "Pandits", bgTint: "#FFFFFF" },
  { id: "samagri", title: "Pooja Samagri", bgTint: "#FFFFFF" },
  { id: "restaurants", title: "Pure Veg Restaurants", bgTint: "#FFFFFF" },
  { id: "delivery", title: "Delivery Services", bgTint: "#FFFFFF" },
];

export function ExploreServices({
  onSelectService,
  onViewAll,
}: {
  onSelectService?: (id: ServiceCardItem["id"]) => void;
  onViewAll?: () => void;
}) {
  const renderIcon = (id: ServiceCardItem["id"]) => {
    switch (id) {
      case "pandits":
        return <PanditIcon size={28} color={colors.primary} />;
      case "samagri":
        return <SamagriIcon size={28} color={colors.saffronDark} />;
      case "restaurants":
        return <RestaurantIcon size={28} color={colors.green} />;
      case "delivery":
        return <DeliveryIcon size={28} color={colors.saffronDark} />;
    }
  };

  return (
    <View style={styles.exploreSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Explore Services</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all services"
          onPress={onViewAll}
          hitSlop={8}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.servicesGrid}>
        {DEFAULT_SERVICES.map((service) => (
          <Pressable
            key={service.id}
            testID={`service-card-${service.id}`}
            accessibilityRole="button"
            accessibilityLabel={service.title}
            onPress={() => onSelectService?.(service.id)}
            style={({ pressed }) => [
              styles.serviceCard,
              pressed && styles.serviceCardPressed,
            ]}
          >
            <View style={styles.serviceIconCircle}>
              {renderIcon(service.id)}
            </View>
            <Text style={styles.serviceCardLabel} numberOfLines={2}>
              {service.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/**
 * Upcoming Booking Card / Section
 */
export interface UpcomingBookingData {
  id: string;
  poojaName: string;
  panditName: string;
  scheduledTime: string;
  status: string;
}

export function UpcomingBooking({
  booking,
  onExploreServices,
  onPressBooking,
}: {
  booking?: UpcomingBookingData | null;
  onExploreServices?: () => void;
  onPressBooking?: () => void;
}) {
  return (
    <View style={styles.upcomingBookingSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Upcoming Booking</Text>
      </View>

      {booking ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Upcoming booking: ${booking.poojaName} with ${booking.panditName}`}
          onPress={onPressBooking}
          style={styles.bookingCard}
        >
          <View style={styles.bookingPoojaImageContainer}>
            <SamagriIcon size={32} color={colors.saffronDark} />
          </View>

          <View style={styles.bookingDetailsContainer}>
            <Text style={styles.bookingPoojaTitle}>{booking.poojaName}</Text>
            <View style={styles.bookingMetaRow}>
              <CalendarIcon size={14} color={colors.textMuted} />
              <Text style={styles.bookingMetaText}>{booking.scheduledTime}</Text>
            </View>
            <View style={styles.bookingMetaRow}>
              <PanditIcon size={14} color={colors.textMuted} />
              <Text style={styles.bookingMetaText}>{booking.panditName}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{booking.status}</Text>
            </View>
          </View>

          <ChevronRightIcon size={20} color={colors.textMuted} style={styles.bookingChevron} />
        </Pressable>
      ) : (
        <View style={styles.emptyBookingCard}>
          <View style={styles.emptyBookingIconCircle}>
            <CalendarIcon size={24} color={colors.primary} />
          </View>
          <Text style={styles.emptyBookingTitle}>No upcoming bookings</Text>
          <Text style={styles.emptyBookingSubtitle}>
            Explore services to make your first sacred booking
          </Text>
          <Pressable
            testID="explore-first-booking-button"
            accessibilityRole="button"
            accessibilityLabel="Explore services to book"
            onPress={onExploreServices}
            style={styles.emptyExploreButton}
          >
            <Text style={styles.emptyExploreButtonText}>Explore Services</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/**
 * 5-Tab Bottom Navigation Bar matching Screen #8
 */
export type TabName = "home" | "bookings" | "orders" | "notifications" | "profile";

export interface BottomTabBarProps {
  activeTab?: TabName;
  onTabPress?: (tab: TabName) => void;
  style?: ViewStyle;
}

export function BottomTabBar({
  activeTab = "home",
  onTabPress,
  style,
}: BottomTabBarProps) {
  const tabs: { id: TabName; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: "home",
      label: "Home",
      icon: (active) => (
        <HomeTabIcon size={22} color={active ? colors.primary : colors.textMuted} />
      ),
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: (active) => (
        <BookingsTabIcon size={22} color={active ? colors.primary : colors.textMuted} />
      ),
    },
    {
      id: "orders",
      label: "Orders",
      icon: (active) => (
        <OrdersTabIcon size={22} color={active ? colors.primary : colors.textMuted} />
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: (active) => (
        <NotificationsTabIcon size={22} color={active ? colors.primary : colors.textMuted} />
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (active) => (
        <ProfileTabIcon size={22} color={active ? colors.primary : colors.textMuted} />
      ),
    },
  ];

  return (
    <View style={[styles.bottomTabBarContainer, style]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            testID={`tab-${tab.id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => onTabPress?.(tab.id)}
            style={styles.tabItem}
          >
            <View style={styles.tabIconWrapper}>
              {tab.icon(isActive)}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive ? <View style={styles.activeTabIndicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  homeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  locationText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginHorizontal: spacing.xs,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  notificationBadgeText: {
    fontFamily: "Inter",
    fontSize: 9,
    fontWeight: "800",
    color: colors.white,
  },
  greetingHeroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greetingTextSection: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  greetingTitle: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  greetingSubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs - 2,
    lineHeight: 20,
  },
  greetingArtSection: {
    width: 95,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroAuraGlow: {
    position: "absolute",
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: colors.saffronLight,
    opacity: 0.6,
  },
  heroTempleArtWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.text,
    height: "100%",
  },
  micButton: {
    padding: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  exploreSection: {
    width: "100%",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  viewAllText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  servicesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  serviceCard: {
    flex: 1,
    marginHorizontal: spacing.xs - 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 104,
    ...shadows.sm,
  },
  serviceCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  serviceIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.warmCreamLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs + 2,
  },
  serviceCardLabel: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    lineHeight: 14,
  },
  upcomingBookingSection: {
    width: "100%",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xxl,
  },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  bookingPoojaImageContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warmCreamLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  bookingDetailsContainer: {
    flex: 1,
  },
  bookingPoojaTitle: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  bookingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  bookingMetaText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.greenLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: 6,
  },
  statusPillText: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    color: colors.green,
  },
  bookingChevron: {
    marginLeft: spacing.sm,
  },
  emptyBookingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  emptyBookingIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyBookingTitle: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  emptyBookingSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs - 2,
    marginBottom: spacing.md,
  },
  emptyExploreButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emptyExploreButtonText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  bottomTabBarContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.xs + 2,
    paddingBottom: spacing.sm + 2,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    ...shadows.md,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: spacing.xs,
  },
  tabIconWrapper: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: "700",
    color: colors.primary,
  },
  activeTabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
