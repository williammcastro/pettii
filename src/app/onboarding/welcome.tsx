import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    AsyncStorage.setItem("onboarding_started", "true");
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido</Text>

        <ImageBackground
          source={require("../../../assets/images/carpetlq.png")}
          style={styles.carpetBackground}
        />

        <LottieView
          source={require("../../../assets/lottie/tamed_puppy.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
        <Text style={styles.subtitle}>
          Tu app para el cuidado de mascotas, veterinarias y diversion en una comunidad
          pensada para ti.
        </Text>

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
    marginTop: 10,
    gap: 5,
    alignItems: "center",
  },
  lottie: {
    width: 450,
    height: 450,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom:30,
  },
  carpetBackground: {
    position: "absolute",
    width: 380,
    height: 300,
    bottom: 50,
    zIndex: 0,
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
