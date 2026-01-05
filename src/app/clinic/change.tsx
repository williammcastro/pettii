import { useJoinClinicByCode, usePrimaryClinic } from "@/features/clinics/hooks";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ChangeClinicModal() {
  const { user, loading } = useAuthStore();
  const userId = user?.id;
  const { data: primaryClinic } = usePrimaryClinic(userId);
  const { mutateAsync: joinClinic, isPending } = useJoinClinicByCode(userId);
  const [clinicCode, setClinicCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async () => {
    const normalized = clinicCode.trim();
    if (!normalized) {
      setError("Ingresa el código de tu veterinaria.");
      return;
    }

    setError(null);
    try {
      await joinClinic(normalized);
      setClinicCode("");
      Alert.alert("Listo", "Veterinaria vinculada.");
      router.back();
    } catch (e: any) {
      const message =
        e?.message ?? "No se pudo vincular la veterinaria. Intenta de nuevo.";
      setError(message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cambiar veterinaria</Text>
      <Text style={styles.subtitle}>
        {primaryClinic?.name
          ? `Actual: ${primaryClinic.name}`
          : "No tienes una veterinaria vinculada."}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Código de veterinaria"
        autoCapitalize="characters"
        value={clinicCode}
        onChangeText={setClinicCode}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        title={isPending ? "Vinculando..." : "Vincular"}
        onPress={handleSubmit}
        disabled={isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8, textAlign: "center" },
  subtitle: { color: "#666", marginBottom: 16, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  errorText: { color: "#c0392b", marginBottom: 10, textAlign: "center" },
});
