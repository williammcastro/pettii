import { usePets } from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function PetDrawerContent(props: DrawerContentComponentProps) {
  const { user, loading, signOut } = useAuthStore();
  const { selectedPetId, setSelectedPetId, setSelectedPetName } =
    usePetSelectionStore();
  const userId = user?.id;
  const { data: pets, isLoading } = usePets(userId, !loading);
  const safePets = useMemo(() => pets ?? [], [pets]);

  useEffect(() => {
    if (!loading && safePets.length > 0 && !selectedPetId) {
      setSelectedPetId(safePets[0].id);
      setSelectedPetName(safePets[0].name);
    }
  }, [loading, safePets, selectedPetId, setSelectedPetId, setSelectedPetName]);

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Usuario</Text>
      <Text style={styles.userEmail}>{user?.email ?? "Sin email"}</Text>
      <View style={styles.divider} />

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
              setSelectedPetName(pet.name);
              props.navigation.closeDrawer();
            }}
          >
            {pet.avatar_signed_url ||
            (pet.avatar_url?.startsWith("http") ? pet.avatar_url : null) ? (
              <Image
                source={{
                  uri:
                    pet.avatar_signed_url ??
                    (pet.avatar_url?.startsWith("http") ? pet.avatar_url : ""),
                }}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
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

      <Pressable
        style={styles.actionButton}
        onPress={() => {
          props.navigation.closeDrawer();
          router.push("/pet/create");
        }}
      >
        <Text style={styles.actionText}>Agregar mascota</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        style={[styles.actionButton, styles.signOutButton]}
        onPress={async () => {
          await AsyncStorage.multiRemove([
            "onboarding_completed",
            "onboarding_started",
            "onboarding_terms_accepted",
            "onboarding_pet_preference",
            "onboarding_clinic_code",
            "onboarding_referral_source",
          ]);
          signOut();
        }}
      >
        <Text style={styles.actionText}>Cerrar sesión</Text>
      </Pressable>
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
  userEmail: {
    color: "#333",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
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
  divider: {
    height: 1,
    backgroundColor: "#e2e2e2",
    marginVertical: 12,
  },
  actionButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    marginBottom: 8,
  },
  signOutButton: {
    backgroundColor: "#ffe7e7",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
