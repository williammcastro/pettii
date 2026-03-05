// src/app/pet/[id].tsx este es el perfil de la mascota cuando se carga por id desde los recomendados o busqueda
import { usePetById, usePetStats } from "@/features/pets/hooks";
import {
  useBlockStatus,
  useBlockUser,
  useUnblockUser,
} from "@/features/blocks/hooks";
import {
  useFollowPet,
  useFollowStatus,
  usePetPosts,
  usePublicFeedPosts,
  useUnfollowPet,
} from "@/features/posts/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { PostWithMedia } from "@/types/post";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = typeof id === "string" ? id : "";
  const { user, loading } = useAuthStore();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const selectedPetId = usePetSelectionStore((s) => s.selectedPetId);
  const selectedPetName = usePetSelectionStore((s) => s.selectedPetName);
  const { data: pet, isLoading: isPetLoading } = usePetById(petId || undefined);
  const targetUserId = pet?.primary_owner_id ?? undefined;
  const { data: stats } = usePetStats(petId || undefined);
  const { data: posts, isLoading: isPostsLoading } = usePetPosts(
    petId || undefined
  );
  const { data: feedPosts } = usePublicFeedPosts();
  const { data: isFollowing } = useFollowStatus(
    selectedPetId ?? undefined,
    petId || undefined
  );
  const { data: isBlocked = false } = useBlockStatus(user?.id, targetUserId);
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const [activePost, setActivePost] = useState<PostWithMedia | null>(null);
  const followMutation = useFollowPet();
  const unfollowMutation = useUnfollowPet();

  const avatarUrl = useMemo(() => {
    if (!pet) return null;
    return (
      pet.avatar_signed_url ??
      (pet.avatar_url?.startsWith("http") ? pet.avatar_url : null)
    );
  }, [pet]);
  const recommendedPetIds = useMemo(() => {
    const ids = (feedPosts ?? [])
      .map((post) => post.pet_id)
      .filter((id) => id && id !== petId);
    const unique = Array.from(new Set(ids));
    for (let i = unique.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.slice(0, 5);
  }, [feedPosts, petId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: selectedPetName ?? "Mascota",
      headerStatusBarHeight: Math.max(insets.top, 12),
    });
  }, [navigation, selectedPetName, insets.top]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  if (!petId) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la mascota.</Text>
      </View>
    );
  }

  const showFollow = !!selectedPetId && selectedPetId !== petId;
  const canBlock = !!targetUserId && !!user?.id && targetUserId !== user.id;

  const handleBlockToggle = () => {
    if (!canBlock || !targetUserId || !user?.id) return;
    if (isBlocked) {
      Alert.alert("Desbloquear usuario", "Volveras a ver su contenido.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desbloquear",
          onPress: async () => {
            await unblockMutation.mutateAsync({
              blocker_user_id: user.id,
              blocked_user_id: targetUserId,
            });
          },
        },
      ]);
      return;
    }

    Alert.alert(
      "Bloquear usuario",
      "No veras su contenido y no podra comentarte.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Bloquear",
          style: "destructive",
          onPress: async () => {
            await blockMutation.mutateAsync({
              blocker_user_id: user.id,
              blocked_user_id: targetUserId,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Atrás</Text>
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {pet?.name?.trim().slice(0, 1).toUpperCase() ?? "P"}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>{pet?.name ?? "Mascota"}</Text>
          <Text style={styles.statusText}>{pet?.status ?? "Sin estado"}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.posts ?? 0}</Text>
              <Text style={styles.statLabel}>Publicaciones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.followers ?? 0}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.following ?? 0}</Text>
              <Text style={styles.statLabel}>Siguiendo</Text>
            </View>
          </View>
        </View>
      </View>

      {showFollow && (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              if (isFollowing) {
                return unfollowMutation.mutateAsync({
                  follower_pet_id: selectedPetId!,
                  followed_pet_id: petId,
                });
              }
              return followMutation.mutateAsync({
                follower_pet_id: selectedPetId!,
                followed_pet_id: petId,
              });
            }}
            style={styles.followButton}
          >
            <Text style={styles.followText}>
              {isFollowing ? "Siguiendo" : "Seguir"}
            </Text>
          </Pressable>
          {canBlock && (
            <Pressable
              onPress={handleBlockToggle}
              disabled={blockMutation.isPending || unblockMutation.isPending}
              style={styles.blockButton}
            >
              <Text style={styles.blockText}>
                {isBlocked ? "Desbloquear" : "Bloquear"}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {recommendedPetIds.length > 0 && (
        <View style={styles.recommendedSection}>
          <Text style={styles.recommendedTitle}>Explorar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedRow}
          >
            {recommendedPetIds.map((recommendedId) => (
              <PetMini key={recommendedId} petId={recommendedId} />
            ))}
          </ScrollView>
        </View>
      )}

      {isPetLoading && <ActivityIndicator />}

      {!isPostsLoading && (posts?.length ?? 0) === 0 && (
        <Text style={styles.mutedText}>Sin publicaciones.</Text>
      )}

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <Pressable style={styles.gridTile} onPress={() => setActivePost(item)}>
            {item.media_type === "image" && item.media_url ? (
              <Image
                source={{ uri: item.media_url }}
                style={styles.gridMedia}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.videoTile}>
                <Text style={styles.videoIcon}>▶</Text>
              </View>
            )}
          </Pressable>
        )}
      />
      <MediaModal
        post={activePost}
        onClose={() => setActivePost(null)}
      />
    </View>
  );
}

function MediaModal({
  post,
  onClose,
}: {
  post: PostWithMedia | null;
  onClose: () => void;
}) {
  const url = post?.media_url ?? "";
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    if (url) p.play();
  });

  useEffect(() => {
    if (post?.media_type === "video" && url) {
      player.play();
      return;
    }
    player.pause();
  }, [player, post?.media_type, url]);

  return (
    <Modal visible={!!post} animationType="slide" onRequestClose={onClose}>
      <View style={styles.mediaModalContainer}>
        {post?.media_type === "video" ? (
          url ? (
            <VideoView
              player={player}
              style={styles.mediaModalContent}
              fullscreenOptions={{ enable: true }}
              allowsPictureInPicture
              nativeControls
            />
          ) : (
            <View style={styles.mediaFallback}>
              <Text style={styles.mediaFallbackText}>Sin video</Text>
            </View>
          )
        ) : url ? (
          <Image
            source={{ uri: url }}
            style={styles.mediaModalContent}
            contentFit="contain"
          />
        ) : (
          <View style={styles.mediaFallback}>
            <Text style={styles.mediaFallbackText}>Sin imagen</Text>
          </View>
        )}
        <Pressable onPress={onClose} style={styles.mediaCloseButton}>
          <Text style={styles.mediaCloseText}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function PetMini({ petId }: { petId: string }) {
  const { data: pet } = usePetById(petId);
  const avatarUrl =
    pet?.avatar_signed_url ??
    (pet?.avatar_url?.startsWith("http") ? pet.avatar_url : null);

  return (
    <Pressable
      onPress={() => router.push(`/pet/${petId}`)}
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
        {pet?.name ?? "Mascota"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { fontWeight: "600", color: "#111" },
  profileCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    marginBottom: 12,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: {
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", color: "#666" },
  profileInfo: { flex: 1 },
  nameText: { fontSize: 18, fontWeight: "700", color: "#111" },
  statusText: { color: "#666", marginTop: 4, marginBottom: 8 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontWeight: "600", color: "#111" },
  statLabel: { fontSize: 12, color: "#666" },
  followButton: {
    alignSelf: "flex-start",
  },
  followText: { fontWeight: "700", color: "#0a7ea4" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  blockButton: {
    alignSelf: "flex-start",
  },
  blockText: {
    color: "#b42318",
    fontWeight: "700",
  },
  recommendedSection: { marginBottom: 12 },
  recommendedTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  recommendedRow: { gap: 12, paddingRight: 10 },
  mutedText: { color: "#666", marginBottom: 8 },
  gridContent: { gap: 6, paddingBottom: 20 },
  gridRow: { gap: 6 },
  gridTile: {
    flex: 1 / 3,
    aspectRatio: 1,
    backgroundColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
  },
  gridMedia: { width: "100%", height: "100%" },
  videoTile: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  videoIcon: { color: "#333", fontWeight: "700" },
  mediaModalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  mediaModalContent: {
    width: "100%",
    height: "100%",
  },
  mediaFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaFallbackText: {
    color: "#fff",
    fontWeight: "600",
  },
  mediaCloseButton: {
    position: "absolute",
    top: 48,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  mediaCloseText: {
    color: "#fff",
    fontWeight: "600",
  },
});
