// src/app/(tabs)/index.tsx
import { usePetById } from "@/features/pets/hooks";
import {
  useCreatePostComment,
  useCreatePostReport,
  useFollowPet,
  useFollowStatus,
  useLikePost,
  usePostCommentCount,
  usePostComments,
  usePostLikeCount,
  usePostLikeStatus,
  useProfilesByIds,
  useRankedFeedPosts,
  useUnfollowPet,
  useUnlikePost,
} from "@/features/posts/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

export default function SocialScreen() {
  const { user, loading } = useAuthStore();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const selectedPetId = usePetSelectionStore((s) => s.selectedPetId);
  const { data: posts, isLoading } = useRankedFeedPosts(selectedPetId ?? undefined);
  const followMutation = useFollowPet();
  const unfollowMutation = useUnfollowPet();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: any }[] }) => {
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
      if (onboardingChecked && onboardingDone) {
        router.replace("/auth/login");
      }
    }
  }, [loading, user, onboardingChecked, onboardingDone]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("onboarding_completed")
      .then((value) => {
        if (active) {
          setOnboardingDone(value === "true");
          setOnboardingChecked(true);
        }
      })
      .catch(() => {
        if (active) {
          setOnboardingChecked(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setActiveVideoId(null);
    }
  }, [isFocused]);

  if (loading || !onboardingChecked || !onboardingDone) {
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
                contentFit="cover"
                cachePolicy="memory"
              />
            ) : item.media_type === "video" && item.media_url ? (
              <FeedVideo
                uri={item.media_url}
                isActive={activeVideoId === item.id}
                isFocused={isFocused}
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
            <PostActions
              postId={item.id}
              userId={user.id}
              onOpenComments={() => {
                setActiveCommentsPostId(item.id);
              }}
            />
            {item.caption && (
              <Text style={{ padding: 12 }}>{item.caption}</Text>
            )}
          </View>
        )}
      />
      <CommentsModal
        postId={activeCommentsPostId}
        userId={user.id}
        onClose={() => setActiveCommentsPostId(null)}
      />
    </View>
  );
}

function FeedVideo({
  uri,
  isActive,
  isFocused,
}: {
  uri: string;
  isActive: boolean;
  isFocused: boolean;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    try {
      if (isActive && isFocused) {
        player.play();
        setIsPaused(false);
      } else {
        player.pause();
        setIsPaused(true);
      }
    } catch {
      // no-op: player might be disposed during unmount
    }
  }, [isActive, isFocused, player]);

  return (
    <View style={{ width: "100%", aspectRatio: 9 / 16, backgroundColor: "#000" }}>
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        allowsPictureInPicture={false}
        nativeControls={false}
        contentFit="cover"
        fullscreenOptions={{ enable: false }}
      />
      <Pressable
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => {
          if (isPaused) {
            player.play();
            setIsPaused(false);
          } else {
            player.pause();
            setIsPaused(true);
          }
        }}
      >
        {isPaused && (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
              ▶
            </Text>
          </View>
        )}
      </Pressable>
    </View>
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

  const isDeletedProfile = !!pet?.is_profile_deleted;
  const showActions = !!followerPetId && followerPetId !== petId && !isDeletedProfile;

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
      <Pressable
        onPress={() => {
          if (isDeletedProfile) {
            Alert.alert("Cuenta eliminada", "Esta cuenta fue eliminada.");
            return;
          }
          router.push(`/pet/${petId}`);
        }}
        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      >
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
            contentFit="cover"
            cachePolicy="memory-disk"
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
        <Text style={{ fontWeight: "600" }}>
          {isDeletedProfile ? "Cuenta eliminada" : pet?.name ?? "Mascota"}
        </Text>
      </Pressable>
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
  posts: { pet_id: string }[];
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
          Explorar
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
  const isDeletedProfile = !!pet?.is_profile_deleted;
  const avatarUrl =
    pet?.avatar_signed_url ??
    (pet?.avatar_url?.startsWith("http") ? pet.avatar_url : null);

  return (
    <Pressable
      onPress={() => {
        if (isDeletedProfile) {
          Alert.alert("Cuenta eliminada", "Esta cuenta fue eliminada.");
          return;
        }
        router.push(`/pet/${petId}`);
      }}
      style={{ alignItems: "center", maxWidth: 64 }}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#eee",
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
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
        {isDeletedProfile ? "Eliminada" : pet?.name ?? "Mascota"}
      </Text>
    </Pressable>
  );
}

function PostActions({
  postId,
  userId,
  onOpenComments,
}: {
  postId: string;
  userId: string;
  onOpenComments: () => void;
}) {
  const { data: isLiked, isLoading } = usePostLikeStatus(postId, userId);
  const { data: likeCount } = usePostLikeCount(postId);
  const { data: commentCount } = usePostCommentCount(postId);
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const reportMutation = useCreatePostReport();

  const toggleLike = async () => {
    if (isLoading) return;
    if (isLiked) {
      await unlikeMutation.mutateAsync({ post_id: postId, user_id: userId });
    } else {
      await likeMutation.mutateAsync({ post_id: postId, user_id: userId });
    }
  };

  const submitReport = async (
    reason: "spam" | "violence_abuse" | "misinformation" | "other"
  ) => {
    try {
      await reportMutation.mutateAsync({
        post_id: postId,
        reporter_user_id: userId,
        reason,
      });
      Alert.alert("Reporte enviado", "Gracias por ayudarnos a cuidar la comunidad.");
    } catch (error: any) {
      const message = (error?.message ?? "").toLowerCase();
      const isDuplicate =
        message.includes("duplicate") ||
        message.includes("unique") ||
        message.includes("23505");
      Alert.alert(
        isDuplicate ? "Ya reportaste este contenido" : "No se pudo enviar el reporte",
        isDuplicate
          ? "Tu reporte anterior ya fue recibido."
          : error?.message ?? "Intenta de nuevo."
      );
    }
  };

  const handleReport = () => {
    if (reportMutation.isPending) return;
    Alert.alert("Reportar contenido", "Selecciona un motivo", [
      {
        text: "Spam",
        onPress: () => {
          void submitReport("spam");
        },
      },
      {
        text: "Violencia/Maltrato",
        onPress: () => {
          void submitReport("violence_abuse");
        },
      },
      {
        text: "Desinformación",
        onPress: () => {
          void submitReport("misinformation");
        },
      },
      {
        text: "Otro",
        onPress: () => {
          void submitReport("other");
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable
            onPress={toggleLike}
            disabled={isLoading || likeMutation.isPending || unlikeMutation.isPending}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
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
          <Pressable
            onPress={onOpenComments}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <MaterialCommunityIcons name="comment-outline" size={24} color="#333" />
            <Text style={{ color: "#333", fontWeight: "600" }}>
              {commentCount ?? 0}
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={handleReport}
          disabled={reportMutation.isPending}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <MaterialCommunityIcons name="flag-outline" size={20} color="#555" />
          <Text style={{ color: "#555", fontWeight: "600" }}>
            {reportMutation.isPending ? "Enviando..." : "Reportar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type CommentsModalProps = {
  postId: string | null;
  userId: string;
  onClose: () => void;
};

function CommentsModal({
  postId,
  userId,
  onClose,
}: CommentsModalProps) {
  const { data: comments, isLoading } = usePostComments(postId ?? undefined);
  const commentUserIds = useMemo(() => {
    const ids = (comments ?? [])
      .map((comment) => comment.user_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    return Array.from(new Set(ids));
  }, [comments]);
  const { data: profiles } = useProfilesByIds(commentUserIds);
  const createComment = useCreatePostComment();
  const [text, setText] = useState("");
  const profileById = useMemo(() => {
    const map = new Map<string, { full_name?: string | null; email?: string | null }>();
    for (const profile of profiles ?? []) {
      map.set(profile.id, profile);
    }
    return map;
  }, [profiles]);

  const handleSend = async () => {
    const body = text.trim();
    if (!postId || body.length === 0) return;
    await createComment.mutateAsync({ post_id: postId, user_id: userId, body });
    setText("");
  };

  return (
    <Modal
      visible={!!postId}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <View
          style={{
            maxHeight: "75%",
            backgroundColor: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>
              Comentarios
            </Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontWeight: "600" }}>Cerrar</Text>
            </Pressable>
          </View>
          {isLoading && <ActivityIndicator />}
          <FlatList
            data={comments ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
            renderItem={({ item }) => (
              <View>
                {(() => {
                  const authorId =
                    typeof item.user_id === "string" ? item.user_id : null;
                  const authorName =
                    !authorId
                      ? "Cuenta eliminada"
                      : authorId === userId
                        ? "Tú"
                        : profileById.get(authorId)?.full_name ||
                          profileById.get(authorId)?.email ||
                          "Usuario";
                  return (
                    <Text style={{ fontWeight: "600", color: "#111" }}>
                      {authorName}
                    </Text>
                  );
                })()}
                <Text style={{ color: "#333" }}>{item.body}</Text>
              </View>
            )}
          />
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: "#eee",
              paddingTop: 10,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escribe un comentario"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
            <Pressable onPress={handleSend}>
              <Text style={{ color: "#0a7ea4", fontWeight: "700" }}>
                Enviar
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
