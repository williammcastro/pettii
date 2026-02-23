import AsyncStorage from "@react-native-async-storage/async-storage";
import { useJoinClinicByCode } from "@/features/clinics/hooks";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function OnboardingClinicCode() {
  const [code, setCode] = useState("");
  const [showConfetti, setShowConfetti] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { mutateAsync: joinClinic, isPending } = useJoinClinicByCode(user?.id);

  const handleNext = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError("Ingresa el código de tu veterinaria.");
      return;
    }

    setError(null);
    await AsyncStorage.setItem("onboarding_clinic_code", normalized);

    // Si ya existe sesión, vinculamos inmediatamente.
    if (user?.id) {
      try {
        await joinClinic(normalized);
        Alert.alert("Listo", "Veterinaria vinculada correctamente.");
      } catch (e: any) {
        const message =
          e?.message ?? "No se pudo vincular la veterinaria. Revisa el código.";
        setError(message);
        Alert.alert("Error", message);
        return;
      }
    } else {
      Alert.alert(
        "Código guardado",
        "Vincularemos la veterinaria cuando inicies sesión."
      );
    }

    router.push("/onboarding/referral");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Código de veterinaria</Text>
          <Text style={styles.subtitle}>
            Ya estamos casi listos, Ahora por favor ingresa el código de tu veterinaria
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Ej: PETTI123"
            style={styles.input}
            autoCapitalize="characters"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.animationStack}>
          <ImageBackground
            source={require("../../../assets/images/consult_lq.png")}
            style={styles.stageBackground}
          />
          <LottieView
            source={require("../../../assets/lottie/happy_dog.json")}
            autoPlay
            loop
            speed={0.5}
            style={styles.lottieHappyDog}
          />
          {showConfetti && (
            <LottieView
              source={require("../../../assets/lottie/confetti_two_side.json")}
              autoPlay
              loop={false}
              speed={0.5}
              onAnimationFinish={(isCancelled) => {
                if (!isCancelled) setShowConfetti(false);
              }}
              style={styles.confettiOverlay}
            />
          )}
        </View>



        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Atrás</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, isPending && styles.primaryButtonDisabled]}
            onPress={handleNext}
            disabled={isPending}
          >
            <Text style={styles.primaryText}>
              {isPending ? "Vinculando..." : "Continuar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  content: {
    marginTop: 40,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 15, color: "#555" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "#c0392b",
    marginTop: 2,
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
  lottieHappyDog: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  animationStack: {
    width: "100%",
    height: 350,
    alignSelf: "center",
    // marginHorizontal: -24,
    marginBottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 0,
    // overflow: "hidden",
    position: "relative",
  },
  stageBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
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
