import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OPTIONS = [
  "Redes sociales",
  "Recomendación",
  "Veterinaria",
  "Búsqueda en Google",
  "Otro",
];

export default function OnboardingReferral() {
  const [selected, setSelected] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handleFinish = async () => {
    await AsyncStorage.setItem(
      "onboarding_referral_source",
      selected ?? ""
    );
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("/auth/login");
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>¿Cómo nos conociste?</Text>
        <Text style={styles.subtitle}>
          Esta info nos ayuda a mejorar la app.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSelected(option)}
              style={[
                styles.option,
                selected === option && styles.optionSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected === option && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Atrás</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleFinish}>
          <Text style={styles.primaryText}>Finalizar</Text>
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
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 15, color: "#555" },
  options: { marginTop: 12, gap: 10 },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },
  optionSelected: {
    backgroundColor: "#e6f6fb",
    borderWidth: 1,
    borderColor: "#0a7ea4",
  },
  optionText: { color: "#333", fontWeight: "600" },
  optionTextSelected: { color: "#0a7ea4" },
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
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryText: { color: "#111", fontWeight: "600" },
});
