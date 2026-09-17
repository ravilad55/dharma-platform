import React from "react";
import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "../../src/auth/store";

export default function ProtectedLayout() {
  const status = useAuthStore((state) => state.status);
  if (status === "unauthenticated") return <Redirect href="/(public)/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}