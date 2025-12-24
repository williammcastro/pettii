// src/app/(tabs)/index.tsx
import {
  useFollowPet,
  useFollowStatus,
  usePublicFeedPosts,
  useUnfollowPet,
} from "@/features/posts/hooks";
import { usePetById } from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

export default function SocialScreen() {
  const { user, loading } = useAuthStore();
  const selectedPetId = usePetSelectionStore((s) => s.selectedPetId);
  const { data: posts, isLoading } = usePublicFeedPosts();
  const followMutation = useFollowPet();
  const unfollowMutation = useUnfollowPet();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: any }> }) => {
      const firstVisibleVideo = viewableItems.find(
        (v) => v.item?.media_type === "video"
      );
      setActiveVideoId(firstVisibleVideo?.item?.id ?? null);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

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

      {isLoading && <ActivityIndicator />}

      {!isLoading && (posts?.length ?? 0) === 0 && (
        <Text>No hay publicaciones de mascotas seguidas.</Text>
      )}

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#f2f2f2",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <PetHeader
              petId={item.pet_id}
              followerPetId={selectedPetId}
              onFollow={async (followedId) => {
                if (!selectedPetId) return;
                await followMutation.mutateAsync({
                  follower_pet_id: selectedPetId,
                  followed_pet_id: followedId,
                });
              }}
              onUnfollow={async (followedId) => {
                if (!selectedPetId) return;
                await unfollowMutation.mutateAsync({
                  follower_pet_id: selectedPetId,
                  followed_pet_id: followedId,
                });
              }}
            />
            {item.media_type === "image" && item.media_url ? (
              <Image
                source={{ uri: item.media_url }}
                style={{ width: "100%", height: 220 }}
                resizeMode="cover"
              />
            ) : item.media_type === "video" && item.media_url ? (
              <FeedVideo
                uri={item.media_url}
                isActive={activeVideoId === item.id}
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

function FeedVideo({ uri, isActive }: { uri: string; isActive: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    try {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // no-op: player might be disposed during unmount
    }
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: 220 }}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls
    />
  );
}

function PetHeader({
  petId,
  followerPetId,
  onFollow,
  onUnfollow,
}: {
  petId: string;
  followerPetId?: string | null;
  onFollow: (petId: string) => Promise<void>;
  onUnfollow: (petId: string) => Promise<void>;
}) {
  const { data: pet } = usePetById(petId);
  const { data: isFollowing, isLoading } = useFollowStatus(
    followerPetId ?? undefined,
    petId
  );

  const showActions = !!followerPetId && followerPetId !== petId;

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#e4e4e4",
      }}
    >
      <Text style={{ fontWeight: "600" }}>{pet?.name ?? "Mascota"}</Text>
      {showActions && !isLoading && (
        <Pressable
          onPress={() =>
            isFollowing ? onUnfollow(petId) : onFollow(petId)
          }
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: isFollowing ? "#eee" : "#0a7ea4",
          }}
        >
          <Text style={{ color: isFollowing ? "#333" : "#fff" }}>
            {isFollowing ? "Siguiendo" : "Seguir"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
