import { useAddPet } from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function CreatePetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutateAsync, isPending } = useAddPet();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [birthdate, setBirthdate] = useState(""); // opcional, formato YYYY-MM-DD

  if (!user) {
    // por seguridad, si no hay user, manda al login
    router.replace("/auth/login");
    return null;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Falta nombre", "La mascota necesita un nombre 🐾");
      return;
    }

    try {
      await mutateAsync({
        name: name.trim(),
        species: species.trim() || undefined,
        breed: breed.trim() || undefined,
        birthdate: birthdate.trim() || undefined,
        avatar_url: undefined, // más adelante lo conectamos con Storage
        primary_owner_id: user.id,
      });

      Alert.alert("Listo", "Mascota creada correctamente.", [
        {
          text: "OK",
          onPress: () => router.replace("/"), // vuelve al Home
        },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message ?? "No se pudo crear la mascota.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear mascota</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre (ej: Rocky)"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Especie (perro, gato...)"
        value={species}
        onChangeText={setSpecies}
      />

      <TextInput
        style={styles.input}
        placeholder="Raza (opcional)"
        value={breed}
        onChangeText={setBreed}
      />

      <TextInput
        style={styles.input}
        placeholder="Fecha de nacimiento (YYYY-MM-DD, opcional)"
        value={birthdate}
        onChangeText={setBirthdate}
      />

      <View style={{ height: 16 }} />

      <Pressable
        style={[styles.primaryButton, isPending && styles.disabledButton]}
        onPress={handleSave}
        disabled={isPending}
      >
        <Text style={styles.primaryText}>
          {isPending ? "Guardando..." : "Guardar mascota"}
        </Text>
      </Pressable>

      <View style={{ height: 8 }} />

      <Pressable style={styles.secondaryButton} onPress={handleCancel}>
        <Text style={styles.secondaryText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#ddd",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
