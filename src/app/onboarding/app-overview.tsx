import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OVERVIEW_ITEMS = [
  {
    title: "1. Ficha de la mascota",
    text:
      "Lleva el historial de salud y crea recordatorios para vacunas, desparasitación y controles importantes.",
  },
  {
    title: "2. Catálogo y pedidos",
    text: "Se el primero en enterarte de promociones, obsequios y novedades de tu veterinaria y realiza pedidos desde la pestaña Shop. ",
  },
  {
    title: "3. Comunidad",
    text:
      "Diviertete compartiendo fotos y videos de tu mascota para interactuar con otros usuarios en la pestaña Social.",
  },
];

export default function OnboardingAppOverview() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Lo que encontrarás en esta App...</Text>
        <Text style={styles.subtitle}>
          Tres espacios para cuidar a tu mascota y conectarte con la comunidad.
        </Text>

        {OVERVIEW_ITEMS.map((item, index) => (
          <OverviewAnimatedCard
            key={item.title}
            title={item.title}
            text={item.text}
            index={index}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Atrás</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "/auth/login",
              params: {
                next: "/onboarding/clinic-code",
              },
            })
          }
        >
          <Text style={styles.primaryText}>Continuar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OverviewAnimatedCard({
  title,
  text,
  index,
}: {
  title: string;
  text: string;
  index: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(
      index * 600,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      index * 600,
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.cardShadow, animatedStyle]}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{text}</Text>
      </View>
    </Animated.View>
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
  cardShadow: {
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  card: {
    backgroundColor: "#a8a5ef",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 4,
    borderColor: "#817df5",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  cardText: {
    fontSize: 14,
    color: "#fff",
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
