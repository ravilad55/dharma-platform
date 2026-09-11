import { router } from "expo-router";
import { Button, Text, View } from "react-native";

import { useAuthStore } from "../../src/auth/store";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <View>
      <Text>Dharma</Text>
      <Text>Welcome{user?.displayName ? `, ${user.displayName}` : ""}</Text>
      <Button onPress={() => void logout().then(() => router.replace("/(public)/login"))} title="Log out" />
    </View>
  );
}