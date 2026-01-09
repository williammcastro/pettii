// src/app/pet/[id].tsx este es el perfil de la mascota cuando se carga por id desde los recomendados o busqueda
import { usePetById, usePetStats } from "@/features/pets/hooks";
import {
  useFollowPet,
  useFollowStatus,
  usePetPosts,
  usePublicFeedPosts,
  useUnfollowPet,
} from "@/features/posts/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
  const { data: stats } = usePetStats(petId || undefined);
  const { data: posts, isLoading: isPostsLoading } = usePetPosts(
    petId || undefined
  );
  const { data: feedPosts } = usePublicFeedPosts();
  const { data: isFollowing } = useFollowStatus(
    selectedPetId ?? undefined,
    petId || undefined
  );
  const followMutation = useFollowPet();
  const unfollowMutation = useUnfollowPet();

  const avatarUrl = useMemo(() => {
    if (!pet) return null;
    return (
      pet.avatar_signed_url ??
      (pet.avatar_url?.startsWith("http") ? pet.avatar_url : null)
    );
  }, [pet]);

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

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Atrás</Text>
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
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
          <View style={styles.gridTile}>
            {item.media_type === "image" && item.media_url ? (
              <Image
                source={{ uri: item.media_url }}
                style={styles.gridMedia}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoTile}>
                <Text style={styles.videoIcon}>▶</Text>
              </View>
            )}
          </View>
        )}
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
    marginBottom: 12,
  },
  followText: { fontWeight: "700", color: "#0a7ea4" },
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
});
