import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { useAuthStore } from "../../src/auth/store";

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  async function submit() {
    setError(null);
    try {
      await verifyOtp(otp, "customer-mobile-device");
      router.replace("/(protected)/home");
    } catch {
      setError("That code is invalid or expired. Request a new code and try again.");
    }
  }

  return (
    <View>
      <Text>Verify your phone</Text>
      <TextInput
        accessibilityLabel="Verification code"
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={setOtp}
        placeholder="6-digit code"
        value={otp}
      />
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button onPress={() => void submit()} title="Verify" />
    </View>
  );
}