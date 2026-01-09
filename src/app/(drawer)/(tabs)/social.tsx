// src/app/(tabs)/index.tsx
import { usePetById } from "@/features/pets/hooks";
import {
  useFollowPet,
  useFollowStatus,
  useLikePost,
  usePostLikeCount,
  usePostLikeStatus,
  useUnlikePost,
  usePublicFeedPosts,
  useUnfollowPet,
} from "@/features/posts/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

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
    <View style={{ flex: 1, padding: 1, backgroundColor: "#fff" }}>
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
        ListHeaderComponent={<RecommendedHeader posts={posts ?? []} />}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#fff",//backgroundColor de la card.
              // borderRadius: 12,
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
                style={{ width: "100%", aspectRatio: 9 / 16 }}
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
            <PostActions postId={item.id} userId={user.id} />
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
      // style={{ width: "100%", height: 260, backgroundColor: "#000" }}
      style={{ width: "100%", aspectRatio: 9 / 16, backgroundColor: "#000" }}
      allowsPictureInPicture={false}
      nativeControls={false}
      contentFit="cover"
      fullscreenOptions={{ enable: false }}
      // surfaceType={Platform.OS === "android" ? "textureView" : "surfaceView"}
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {pet?.avatar_signed_url ||
        (pet?.avatar_url?.startsWith("http") ? pet.avatar_url : null) ? (
          <Image
            source={{
              uri:
                pet?.avatar_signed_url ??
                (pet?.avatar_url?.startsWith("http")
                  ? pet.avatar_url
                  : ""),
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#eee",
            }}
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#eee",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#666" }}>
              PET
            </Text>
          </View>
        )}
        <Text style={{ fontWeight: "600" }}>{pet?.name ?? "Mascota"}</Text>
      </View>
      {showActions && !isLoading && (
        <Pressable
          onPress={() =>
            isFollowing ? onUnfollow(petId) : onFollow(petId)
          }
          style={{
            paddingHorizontal: 0,
            paddingVertical: 0,
            borderRadius: 0,
            backgroundColor: "transparent",
          }}
        >
          <Text
            style={{
              color: isFollowing ? "#111" : "#0a7ea4",
              fontWeight: isFollowing ? "700" : "600",
            }}
          >
            {isFollowing ? "Siguiendo" : "Seguir"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function RecommendedHeader({
  posts,
}: {
  posts: Array<{ pet_id: string }>;
}) {
  const petIds = useMemo(() => {
    const unique = Array.from(new Set(posts.map((post) => post.pet_id)));
    for (let i = unique.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.slice(0, 5);
  }, [posts]);

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 10,
          paddingTop: 4,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "600", color: "#000" }}>
          Recomendados
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 10 }}
        >
          {petIds.map((petId) => (
            <PetMini key={petId} petId={petId} />
          ))}
        </ScrollView>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: "#ececec",
          marginHorizontal: 10,
        }}
      />
    </View>
  );
}

function PetMini({ petId }: { petId: string }) {
  const { data: pet } = usePetById(petId);
  const avatarUrl =
    pet?.avatar_signed_url ??
    (pet?.avatar_url?.startsWith("http") ? pet.avatar_url : null);

  return (
    <View style={{ alignItems: "center", maxWidth: 64 }}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#eee",
          }}
        />
      ) : (
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#eee",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#666" }}>
            PET
          </Text>
        </View>
      )}
      <Text
        style={{ fontSize: 11, marginTop: 4, color: "#111" }}
        numberOfLines={1}
      >
        {pet?.name ?? "Mascota"}
      </Text>
    </View>
  );
}

function PostActions({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  const { data: isLiked, isLoading } = usePostLikeStatus(postId, userId);
  const { data: likeCount } = usePostLikeCount(postId);
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();

  const toggleLike = async () => {
    if (isLoading) return;
    if (isLiked) {
      await unlikeMutation.mutateAsync({ post_id: postId, user_id: userId });
    } else {
      await likeMutation.mutateAsync({ post_id: postId, user_id: userId });
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Pressable
        onPress={toggleLike}
        disabled={isLoading || likeMutation.isPending || unlikeMutation.isPending}
        style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6 }}
      >
        <MaterialCommunityIcons
          name={isLiked ? "heart" : "heart-outline"}
          size={24}
          color={isLiked ? "#000" : "#333"}
        />
        <Text style={{ color: "#333", fontWeight: "600" }}>
          {likeCount ?? 0}
        </Text>
      </Pressable>
    </View>
  );
}
