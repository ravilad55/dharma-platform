import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";

import { useAuthStore } from "../src/auth/store";

export default function Index() {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status === "bootstrapping") {
    return (
      <View>
        <ActivityIndicator accessibilityLabel="Restoring session" />
      </View>
    );
  }

  return status === "authenticated" ? <Redirect href="/(protected)/home" /> : <Redirect href="/(public)/login" />;
}
