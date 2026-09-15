import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";

import { useAuthStore } from "../auth/store";
import type { TabName } from "../design-system";

const tabRoutes: Partial<Record<TabName, string>> = {
  home: "/(protected)/home",
  orders: "/(protected)/orders",
};

const tabTitles: Record<TabName, string> = {
  home: "Home",
  bookings: "Bookings",
  orders: "Orders",
  notifications: "Notifications",
  profile: "Profile",
};

/**
 * Shared behaviour for the existing BottomTabBar so each tab screen renders one navigation
 * implementation. Home and Orders are real routes; Bookings and Notifications are not built yet,
 * and Profile keeps the existing logout behaviour.
 */
export function useTabNavigation(initialTab: TabName) {
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState<TabName>(initialTab);

  const onTabPress = useCallback(
    (tab: TabName) => {
      setActiveTab(tab);
      if (tab === initialTab) return;

      if (tab === "profile") {
        void logout().finally(() => router.replace("/(public)/login"));
        return;
      }

      const route = tabRoutes[tab];
      if (route) {
        router.replace(route);
        return;
      }

      if (Platform.OS !== "web") {
        Alert.alert(tabTitles[tab], `${tabTitles[tab]} will be available in an upcoming Dharma slice.`);
      }
    },
    [initialTab, logout]
  );

  return { activeTab, onTabPress };
}