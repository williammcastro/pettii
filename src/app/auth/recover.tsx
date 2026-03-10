import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function RecoverPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecover = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert("Falta el correo", "Ingresa tu correo para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: "https://pettii.com/recovery",
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Correo enviado",
        "Te enviamos un enlace para restablecer tu contraseña."
      );
      router.back();
    } catch (e: any) {
      Alert.alert("Error inesperado", e?.message ?? "Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Pressable
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
          onPress={handleRecover}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryText}>
            {isSubmitting ? "Enviando..." : "Enviar enlace"}
          </Text>
        </Pressable>

        <Pressable style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>Volver a iniciar sesión</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  content: {
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  linkButton: {
    alignItems: "center",
    marginTop: 4,
  },
  linkText: {
    color: "#0a7ea4",
    fontWeight: "600",
  },
});
