import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingTerms() {
  const [accepted, setAccepted] = useState(false);
  const insets = useSafeAreaInsets();

  const handleToggle = async (value: boolean) => {
    setAccepted(value);
    await AsyncStorage.setItem("onboarding_terms_accepted", value ? "true" : "false");
    if (value && Platform.OS === "ios") {
      await requestTrackingPermissionsAsync();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Términos y privacidad</Text>
        <Text style={styles.subtitle}>
          Antes de continuar, revisa nuestros términos y la política de
          privacidad.
        </Text>

        <Pressable
          onPress={() => Linking.openURL("https://pettii.com/terms")}
        >
          <Text style={styles.link}>Ver términos y condiciones</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("https://pettii.com/privacy")}
        >
          <Text style={styles.link}>Ver política de privacidad</Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            Acepto los términos y la política
          </Text>
          <Switch value={accepted} onValueChange={handleToggle} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Atrás</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, !accepted && styles.disabledButton]}
          onPress={() => router.push("/onboarding/pet-preference")}
          disabled={!accepted}
        >
          <Text style={styles.primaryText}>Continuar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  content: {
    marginTop: 40,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
  },
  link: {
    color: "#0a7ea4",
    fontWeight: "600",
  },
  switchRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    color: "#333",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#bbb",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryText: {
    color: "#111",
    fontWeight: "600",
  },
});
