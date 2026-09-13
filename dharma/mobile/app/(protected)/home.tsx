import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";

import { useAuthStore } from "../../src/auth/store";
import {
  BottomTabBar,
  colors,
  DharmaSearchBar,
  ExploreServices,
  HomeGreeting,
  HomeHeader,
  ServiceCardItem,
  TabName,
  UpcomingBooking,
} from "../../src/design-system";

export default function HomeScreen() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const location = "Thane, Maharashtra";

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/(public)/login");
  };

  const handleLocationPress = () => {
    const msg = "Location selector will be available in Slice 2.";
    if (Platform.OS !== "web") {
      Alert.alert("Location", msg);
    }
  };

  const handleNotificationPress = () => {
    const msg = "You have 2 new spiritual updates.";
    if (Platform.OS !== "web") {
      Alert.alert("Notifications", msg);
    }
  };

  const handleSelectService = (serviceId: ServiceCardItem["id"]) => {
    const titles: Record<ServiceCardItem["id"], string> = {
      pandits: "Pandit Booking",
      samagri: "Pooja Samagri Store",
      restaurants: "Pure Veg Restaurants",
      delivery: "Delivery Services",
    };

    const title = titles[serviceId] ?? "Service";
    if (Platform.OS !== "web") {
      Alert.alert(title, `${title} discovery will be available in upcoming slices.`);
    }
  };

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === "profile") {
      void handleLogout();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.mainContainer}>
        {/* Top Header Row */}
        <HomeHeader
          location={location}
          unreadCount={2}
          onLocationPress={handleLocationPress}
          onNotificationPress={handleNotificationPress}
        />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting Hero Section */}
          <HomeGreeting displayName={user?.displayName} />

          {/* Search Bar */}
          <DharmaSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Dharma..."
            onMicPress={() => {}}
          />

          {/* Explore Services 4-Card Grid */}
          <ExploreServices
            onSelectService={handleSelectService}
            onViewAll={() => handleSelectService("pandits")}
          />

          {/* Upcoming Booking Section */}
          <UpcomingBooking
            booking={null}
            onExploreServices={() => handleSelectService("pandits")}
          />
        </ScrollView>

        {/* 5-Tab Bottom Navigation Bar */}
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: colors.warmCream,
    justifyContent: "space-between",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
