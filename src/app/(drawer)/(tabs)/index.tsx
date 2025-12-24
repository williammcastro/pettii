import { usePetPosts, useCreatePetPost } from "@/features/posts/hooks";
import { usePets } from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const { user, loading } = useAuthStore();
  const { selectedPetId, setSelectedPetId } = usePetSelectionStore();
  const userId = user?.id;
  const { data: posts, isLoading: isPostsLoading } = usePetPosts(
    selectedPetId ?? undefined
  );
  const { mutateAsync, isPending } = useCreatePetPost();
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

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

  const handlePickMedia = async () => {
    if (!selectedPetId || !userId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const mediaType =
      asset.type === "video" ? "video" : ("image" as const);

    await mutateAsync({
      owner_user_id: userId,
      pet_id: selectedPetId,
      media_type: mediaType,
      local_uri: asset.uri,
      mime_type: asset.mimeType ?? undefined,
    });
  };

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

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Galería</Text>
        <Pressable
          onPress={handlePickMedia}
          disabled={isPending || !selectedPetId}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: "#0a7ea4",
            borderRadius: 8,
            opacity: isPending || !selectedPetId ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {isPending ? "Subiendo..." : "Subir"}
          </Text>
        </Pressable>
      </View>

      {isPostsLoading && <ActivityIndicator />}

      {!isPostsLoading && (posts?.length ?? 0) === 0 && (
        <Text>No hay publicaciones todavía.</Text>
      )}

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 6 }}
        contentContainerStyle={{ gap: 6, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1 / 3,
              aspectRatio: 1,
              backgroundColor: "#eee",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {item.media_type === "image" && item.media_url ? (
              <Image
                source={{ uri: item.media_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : item.media_type === "video" ? (
              <VideoThumbnail
                postId={item.id}
                mediaUrl={item.media_url ?? undefined}
                thumbs={thumbs}
                setThumbs={setThumbs}
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#666" }}>Sin media</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

function VideoThumbnail({
  postId,
  mediaUrl,
  thumbs,
  setThumbs,
}: {
  postId: string;
  mediaUrl?: string;
  thumbs: Record<string, string>;
  setThumbs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  useEffect(() => {
    let active = true;

    async function loadThumbnail() {
      if (!mediaUrl || thumbs[postId]) return;
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(mediaUrl, {
          time: 1000,
        });
        if (active) {
          setThumbs((prev) => ({ ...prev, [postId]: uri }));
        }
      } catch {
        if (active) {
          setThumbs((prev) => ({ ...prev, [postId]: "" }));
        }
      }
    }

    loadThumbnail();

    return () => {
      active = false;
    };
  }, [mediaUrl, postId, setThumbs, thumbs]);

  const uri = thumbs[postId];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ccc",
      }}
    >
      <Text style={{ color: "#333", fontWeight: "600" }}>Video</Text>
    </View>
  );
}
