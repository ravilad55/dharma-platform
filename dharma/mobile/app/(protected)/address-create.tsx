import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createAddress } from "../../src/api/addresses";
import { getErrorMessage } from "../../src/api/errors";
import {
  borderRadius,
  colors,
  DharmaButton,
  DharmaCheckbox,
  shadows,
  spacing,
} from "../../src/design-system";
import { useOrderReviewStore } from "../../src/features/orders/orderReviewStore";

type FormValues = {
  label: string;
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const initialValues: FormValues = {
  label: "",
  contactName: "",
  contactPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize,
  testID,
  textContentType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  keyboardType?: "default" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  testID?: string;
  textContentType?: "name" | "fullStreetAddress" | "postalCode" | "telephoneNumber" | "countryName" | "addressCity" | "addressState" | "organizationName";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={[styles.input, Boolean(error) && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        autoCapitalize={autoCapitalize ?? "sentences"}
        keyboardType={keyboardType ?? "default"}
        textContentType={textContentType}
        accessibilityLabel={label}
      />
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function AddressCreateScreen() {
  const queryClient = useQueryClient();
  const setSelectedAddressId = useOrderReviewStore((state) => state.setSelectedAddressId);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isDefault, setIsDefault] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const createAddressMutation = useMutation({
    mutationFn: (payload: FormValues) =>
      createAddress({
        label: payload.label,
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
        addressLine1: payload.addressLine1,
        addressLine2: payload.addressLine2.trim() || null,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        country: payload.country,
        latitude: null,
        longitude: null,
        isDefault,
      }),
    onSuccess: async (address) => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelectedAddressId(address.id);
      router.dismissTo("/(protected)/order-review");
    },
  });

  const setField = (field: keyof FormValues) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.label.trim()) next.label = "Please enter a label for this address.";
    if (!values.contactName.trim()) next.contactName = "Please enter the contact name.";
    if (!values.contactPhone.trim()) next.contactPhone = "Please enter the contact phone number.";
    if (!values.addressLine1.trim()) next.addressLine1 = "Please enter address line 1.";
    if (!values.city.trim()) next.city = "Please enter the city.";
    if (!values.state.trim()) next.state = "Please enter the state.";
    const postal = values.postalCode.trim();
    if (!postal) next.postalCode = "Please enter the postal code.";
    else if (postal.length < 4 || postal.length > 20) next.postalCode = "Postal code must be between 4 and 20 characters.";
    const country = values.country.trim();
    if (!country) next.country = "Please enter the country code (for example IN).";
    else if (country.length !== 2) next.country = "Country must be a 2-letter code (for example IN).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate() || createAddressMutation.isPending) return;
    createAddressMutation.mutate(values);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
              <Text style={styles.back}>‹</Text>
            </Pressable>
            <Text style={styles.title}>Add Address</Text>
            <View style={styles.headerSpace} />
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} testID="address-create-form">
            <FormField label="Address Label" value={values.label} onChangeText={setField("label")} placeholder="Home / Work" error={errors.label} testID="address-label" autoCapitalize="words" textContentType="organizationName" />
            <FormField label="Contact Name" value={values.contactName} onChangeText={setField("contactName")} placeholder="Full name" error={errors.contactName} testID="address-contact-name" autoCapitalize="words" textContentType="name" />
            <FormField label="Contact Phone" value={values.contactPhone} onChangeText={setField("contactPhone")} placeholder="+91 mobile number" error={errors.contactPhone} testID="address-contact-phone" keyboardType="phone-pad" autoCapitalize="none" textContentType="telephoneNumber" />
            <FormField label="Address Line 1" value={values.addressLine1} onChangeText={setField("addressLine1")} placeholder="Flat, house number, street" error={errors.addressLine1} testID="address-line-1" textContentType="fullStreetAddress" />
            <FormField label="Address Line 2 (optional)" value={values.addressLine2} onChangeText={setField("addressLine2")} placeholder="Area, landmark" testID="address-line-2" />
            <FormField label="City" value={values.city} onChangeText={setField("city")} placeholder="City" error={errors.city} testID="address-city" textContentType="addressCity" />
            <FormField label="State" value={values.state} onChangeText={setField("state")} placeholder="State" error={errors.state} testID="address-state" textContentType="addressState" />
            <FormField label="Postal Code" value={values.postalCode} onChangeText={setField("postalCode")} placeholder="PIN code" error={errors.postalCode} testID="address-postal-code" keyboardType="phone-pad" autoCapitalize="none" textContentType="postalCode" />
            <FormField label="Country" value={values.country} onChangeText={setField("country")} placeholder="IN" error={errors.country} testID="address-country" autoCapitalize="characters" textContentType="countryName" />

            <View style={styles.defaultRow}>
              <DharmaCheckbox checked={isDefault} onToggle={() => setIsDefault((current) => !current)} label="Make this my default delivery address" testID="address-is-default" />
            </View>

            {createAddressMutation.isError ? (
              <Text style={styles.errorBanner} testID="address-create-error">
                {getErrorMessage(createAddressMutation.error, "We couldn't save this address. Please try again.")}
              </Text>
            ) : null}

            <DharmaButton title="Save Address" testID="save-address" loading={createAddressMutation.isPending} onPress={handleSave} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.warmCream },
  screen: { flex: 1, backgroundColor: colors.warmCream },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  headerButton: { width: 40, minHeight: 44, justifyContent: "center" },
  back: { color: colors.text, fontSize: 40, fontWeight: "300", lineHeight: 42 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", fontFamily: "Inter" },
  headerSpace: { width: 40 },
  form: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl, paddingTop: spacing.sm },
  field: { marginBottom: spacing.md },
  label: { fontFamily: "Inter", fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.xs + 2 },
  input: { height: 52, backgroundColor: colors.cardBackground, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontFamily: "Inter", fontSize: 15, color: colors.text },
  inputError: { borderColor: colors.borderError },
  errorText: { fontFamily: "Inter", fontSize: 12, color: colors.error, marginTop: spacing.xs },
  defaultRow: { marginVertical: spacing.sm },
  errorBanner: { color: colors.error, fontSize: 14, fontWeight: "700", fontFamily: "Inter", marginBottom: spacing.md, textAlign: "center" },
});