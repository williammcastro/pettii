import { usePets } from "@/features/pets/hooks";
import { useAuth } from "@/providers/AuthProvider";
import { router } from "expo-router";
import { useEffect } from "react";
import { Button, Text, View } from "react-native";

export default function HomeScreen() {
  const { user, loading, signOut } = useAuth();

  // Redirección si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user]);

  // Mientras carga la sesión o no hay usuario, no renderizamos nada
  if (loading || !user) return null;

  const { data: pets, isLoading } = usePets(user.id);
  const safePets = pets ?? []; // 👈 siempre es un array

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Bienvenido 🐾</Text>
      <Text style={{ marginBottom: 20 }}>Usuario: {user.email}</Text>

      {isLoading && <Text>Cargando mascotas...</Text>}

      {!isLoading && safePets.length === 0 && (
        <Text>No tienes mascotas registradas. ¡Agrega una!</Text>
      )}

      {!isLoading &&
        safePets.length > 0 &&
        safePets.map((pet) => (
          <View
            key={pet.id}
            style={{
              padding: 16,
              backgroundColor: "#eee",
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {pet.name}
            </Text>
            <Text>{pet.species}</Text>
            <Text>{pet.breed}</Text>
          </View>
        ))}

      <View style={{ height: 20 }} />
        <Button
          title="Agregar mascota"
          onPress={() => router.push("/pet/create")}
        />

      <View style={{ height: 12 }} />

      <Button title="Cerrar sesión" onPress={signOut} />
    </View>
  );
}