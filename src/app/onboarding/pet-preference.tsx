import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Preference = "dog" | "cat" | "other";

export default function OnboardingPetPreference() {
  const [selected, setSelected] = useState<Preference | null>(null);
  const insets = useSafeAreaInsets();

  const options: { id: Preference; label: string; emoji: string }[] = [
    { id: "dog", label: "Perritos", emoji: "🐶" },
    { id: "cat", label: "Gatitos", emoji: "🐱" },
    { id: "other", label: "Otro", emoji: "🐾" },
  ];

  const handleNext = async () => {
    if (!selected) return;
    await AsyncStorage.setItem("onboarding_pet_preference", selected);
    router.push("/onboarding/app-overview");
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>¿Eres más de...?</Text>
        <Text style={styles.subtitle}>
          Elige lo que más te gusta para personalizar tu experiencia.
        </Text>

        <View style={styles.cards}>
          {options.map((option) => (
            <View key={option.id} style={styles.cardShadow}>
              <Pressable
                onPress={() => setSelected(option.id)}
                style={[
                  styles.card,
                  selected === option.id && styles.cardSelected,
                ]}
              >
                <Text style={styles.cardEmoji}>{option.emoji}</Text>
                <Text style={styles.cardLabel}>{option.label}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.animationStack}>

        <LottieView
          source={require("../../../assets/lottie/reward_light.json")}
          autoPlay
          loop
          style={styles.lottieOverlay}
          />

        { selected === "dog" && (
          <Animated.View key="dog-fade" entering={FadeIn.duration(500)}>
            <LottieView
              source={require("../../../assets/lottie/walking_dog.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          </Animated.View>
        )}
        { selected === "cat" && (
          <Animated.View key="cat-fade" entering={FadeIn.duration(600)}>
            <LottieView
              source={require("../../../assets/lottie/bad_cat_mug.json")}
              autoPlay
              loop={false}
              speed={0.5}
              style={styles.lottie}
            />
          </Animated.View>
        )}
        { selected === "other" && (
          <LottieView
          source={require("../../../assets/lottie/cat_in_box.json")}
          autoPlay
          loop={false}
          speed={0.5}
          style={styles.lottie}
          />
        )}


      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Atrás</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, !selected && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selected}
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
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 15, color: "#555" },
  cards: { flexDirection: "row", gap: 12, marginTop: 16 },
  cardShadow: {
    flex: 1,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  card: {
    width: "100%",
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    gap: 8,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#0a7ea4",
    backgroundColor: "#e6f6fb",
  },
  cardEmoji: { fontSize: 28 },
  cardLabel: { fontWeight: "600", color: "#333" },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  lottie: {
    width: 350,
    height: 350,
    marginBottom: 8,
    zIndex: 10,
  },
  lottieOverlay: {
    position: "absolute",
    width: 350,
    height: 350,
    bottom: 10,
    alignSelf: "center",
    zIndex: 0,
  },
  animationStack: {
    width: 350,
    height: 350,
    alignSelf: "center",
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
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
  disabledButton: { backgroundColor: "#bbb" },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryText: { color: "#111", fontWeight: "600" },
});
