import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function OnboardingWelcome() {
  useEffect(() => {
    AsyncStorage.setItem("onboarding_started", "true");
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido a Pettii</Text>
        <Text style={styles.subtitle}>
          Tu app para el cuidado de mascotas, veterinarias y una comunidad
          pensada para ti.
        </Text>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/onboarding/terms")}
      >
        <Text style={styles.primaryText}>Comenzar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  content: {
    marginTop: 60,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
