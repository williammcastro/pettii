// src/app/(tabs)/index.tsx
import { useFeedPosts } from "@/features/posts/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  View,
} from "react-native";

export default function SocialScreen() {
  const { user, loading } = useAuthStore();
  const selectedPetId = usePetSelectionStore((s) => s.selectedPetId);
  const { data: posts, isLoading } = useFeedPosts(selectedPetId ?? undefined);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    // mientras hace el replace
    return null;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Social
      </Text>

      {!selectedPetId && (
        <Text>Selecciona una mascota desde el menú lateral.</Text>
      )}

      {selectedPetId && isLoading && <ActivityIndicator />}

      {selectedPetId && !isLoading && (posts?.length ?? 0) === 0 && (
        <Text>No hay publicaciones de mascotas seguidas.</Text>
      )}

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#f2f2f2",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {item.media_type === "image" && item.media_url ? (
              <Image
                source={{ uri: item.media_url }}
                style={{ width: "100%", height: 220 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 220,
                  backgroundColor: "#ccc",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "600" }}>Video</Text>
              </View>
            )}
            {item.caption && (
              <Text style={{ padding: 12 }}>{item.caption}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}
