import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useState } from "react";
import {
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

  const handleNext = async () => {
    await AsyncStorage.setItem("onboarding_clinic_code", code.trim());
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
          />
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
          <Pressable style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryText}>Continuar</Text>
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
