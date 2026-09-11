import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { useAuthStore } from "../../src/auth/store";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const requestOtp = useAuthStore((state) => state.requestOtp);

  async function submit() {
    setError(null);
    try {
      const challenge = await requestOtp(phoneNumber, "customer-mobile-device");
      router.push({ pathname: "/(public)/verify-otp", params: { challengeId: challenge.challengeId } });
    } catch {
      setError("We could not send a verification code. Please try again.");
    }
  }

  return (
    <View>
      <Text>Dharma</Text>
      <Text>Sign in with your phone number</Text>
      <TextInput
        accessibilityLabel="Phone number"
        autoComplete="tel"
        keyboardType="phone-pad"
        onChangeText={setPhoneNumber}
        placeholder="+91..."
        value={phoneNumber}
      />
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button onPress={() => void submit()} title="Send verification code" />
    </View>
  );
}