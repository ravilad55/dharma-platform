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
import { useTabNavigation } from "../../src/hooks/useTabNavigation";
import {
  BottomTabBar,
  colors,
  DharmaSearchBar,
  ExploreServices,
  HomeGreeting,
  HomeHeader,
  ServiceCardItem,
  UpcomingBooking,
} from "../../src/design-system";

export default function HomeScreen() {
  const { activeTab, onTabPress: handleTabPress } = useTabNavigation("home");
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");

  const location = "Thane, Maharashtra";

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
    if (serviceId === "samagri") {
      router.push("/(protected)/samagri");
      return;
    }

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

  if (status === "unauthenticated") {
    return <Redirect href="/(public)/login" />;
  }

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
