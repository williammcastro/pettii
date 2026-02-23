import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingAppOverview() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Esto es lo que encontrarás en Pettii</Text>
        <Text style={styles.subtitle}>
          Tres espacios para cuidar a tu mascota y conectarte con la comunidad.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Ficha de la mascota</Text>
          <Text style={styles.cardText}>
            Lleva el historial y crea recordatorios para vacunas, desparasitación
            y controles importantes.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Catálogo y pedidos</Text>
          <Text style={styles.cardText}>
            Explora productos de tu veterinaria y realiza pedidos
            desde la pestaña Shop.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Comunidad</Text>
          <Text style={styles.cardText}>
            Diviertete compartiendo fotos y videos de tu mascota para interactuar con otros
            usuarios en la pestaña Social.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Atrás</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/onboarding/clinic-code")}
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
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#9f9cec",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 4,
    borderColor: "#706cf1",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  cardText: {
    fontSize: 14,
    color: "#eee",
    lineHeight: 20,
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
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryText: {
    color: "#111",
    fontWeight: "600",
  },
});
