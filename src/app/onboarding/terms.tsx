import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingTerms() {
  const START_FRAME = 0;
  const END_FRAME = 90; // ajusta este valor para cortar el final

  const [accepted, setAccepted] = useState(false);
  const insets = useSafeAreaInsets();
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    lottieRef.current?.play(START_FRAME, END_FRAME);
  }, [START_FRAME, END_FRAME]);

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

        <LottieView
          ref={lottieRef}
          source={require("../../../assets/lottie/cat_error.json")}
          autoPlay={false}
          loop
          style={styles.lottie}
        />

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
    lottie: {
    width: 350,
    height: 350,
    marginBottom: 8,
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
