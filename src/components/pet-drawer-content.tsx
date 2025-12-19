import { DrawerContentScrollView, type DrawerContentComponentProps } from "@react-navigation/drawer";
import { usePets } from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export function PetDrawerContent(props: DrawerContentComponentProps) {
  const { user, loading } = useAuthStore();
  const { selectedPetId, setSelectedPetId } = usePetSelectionStore();
  const userId = user?.id;
  const { data: pets, isLoading } = usePets(userId, !loading);
  const safePets = pets ?? [];

  useEffect(() => {
    if (!loading && safePets.length > 0 && !selectedPetId) {
      setSelectedPetId(safePets[0].id);
    }
  }, [loading, safePets, selectedPetId, setSelectedPetId]);

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mascotas</Text>

      {!loading && isLoading && <Text style={styles.muted}>Cargando mascotas...</Text>}

      {!loading && !isLoading && safePets.length === 0 && (
        <Text style={styles.muted}>No tienes mascotas registradas.</Text>
      )}

      {safePets.map((pet) => {
        const isSelected = pet.id === selectedPetId;
        return (
          <Pressable
            key={pet.id}
            style={[styles.petRow, isSelected && styles.petRowSelected]}
            onPress={() => {
              setSelectedPetId(pet.id);
              props.navigation.closeDrawer();
            }}
          >
            {pet.avatar_url ? (
              <Image source={{ uri: pet.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>
                  {pet.name?.trim().slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.petName}>{pet.name}</Text>
          </Pressable>
        );
      })}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  muted: {
    color: "#666",
    marginBottom: 8,
  },
  petRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f2f2f2",
  },
  petRowSelected: {
    backgroundColor: "#e0f0ff",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: "#bbb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "600",
  },
  petName: {
    fontSize: 16,
  },
});
