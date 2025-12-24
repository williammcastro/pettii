import { usePets } from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function HomeScreen() {
  const { user, loading } = useAuthStore();
  const { selectedPetId, setSelectedPetId } = usePetSelectionStore();
  const userId = user?.id;

  // Redirección si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user]);

  const { data: pets, isLoading } = usePets(userId, !loading);
  const safePets = pets ?? []; // 👈 siempre es un array
  const selectedPet = safePets.find((pet) => pet.id === selectedPetId);

  useEffect(() => {
    if (!loading && safePets.length > 0 && !selectedPetId) {
      setSelectedPetId(safePets[0].id);
    }
  }, [loading, safePets, selectedPetId, setSelectedPetId]);

  // Mientras carga la sesión o no hay usuario, no renderizamos contenido
  if (loading || !user) return null;

  return (
    <View style={{ flex: 1, padding: 30, paddingTop: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Bienvenido 🐾</Text>
      <Text style={{ marginBottom: 20 }}>Usuario: {user.email}</Text>

      {isLoading && <Text>Cargando mascotas...</Text>}

      {!isLoading && safePets.length === 0 && (
        <Text>No tienes mascotas registradas. ¡Agrega una!</Text>
      )}

      {!isLoading && safePets.length > 0 && !selectedPet && (
        <Text>Selecciona una mascota desde el menú lateral.</Text>
      )}

      {!isLoading && selectedPet && (
        <View
          style={{
            padding: 16,
            backgroundColor: "#eee",
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            {selectedPet.name}
          </Text>
          <Text>{selectedPet.species}</Text>
          <Text>{selectedPet.breed}</Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </View>
  );
}
