import { usePets, usePetStats } from "@/features/pets/hooks";
import {
  useCreatePetPost,
  useDeletePetPost,
  useMyMediaQuota,
  usePetPosts,
} from "@/features/posts/hooks";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { PostWithMedia } from "@/types/post";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const HOME_CONFETTI_SHOWN_KEY = "home_confetti_shown_after_onboarding_v1";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function HomeScreen() {
  const { user, loading } = useAuthStore();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showFirstHomeConfetti, setShowFirstHomeConfetti] = useState(false);
  const { selectedPetId, setSelectedPetId } = usePetSelectionStore();
  const userId = user?.id;
  const { data: posts, isLoading: isPostsLoading } = usePetPosts(
    selectedPetId ?? undefined
  );
  const { mutateAsync, isPending } = useCreatePetPost();
  const { mutateAsync: deletePostAsync, isPending: isDeleting } =
    useDeletePetPost();
  const { data: mediaQuota } = useMyMediaQuota(!!userId);
  const colorScheme = useColorScheme();
  const [isPickingMedia, setIsPickingMedia] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [activePost, setActivePost] = useState<PostWithMedia | null>(null);

  // Redirección si no hay usuario
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

  const { data: pets, isLoading } = usePets(userId, !loading);
  const safePets = useMemo(() => pets ?? [], [pets]);
  const selectedPet = safePets.find((pet) => pet.id === selectedPetId);
  const { data: petStats } = usePetStats(selectedPet?.id);


  useEffect(() => {
    if (!loading && safePets.length > 0 && !selectedPetId) {
      setSelectedPetId(safePets[0].id);
    }
  }, [loading, safePets, selectedPetId, setSelectedPetId]);

  useEffect(() => {
    let active = true;
    if (!onboardingChecked || !onboardingDone) return;

    AsyncStorage.getItem(HOME_CONFETTI_SHOWN_KEY)
      .then(async (value) => {
        if (!active || value === "true") return;
        setShowFirstHomeConfetti(true);
        await AsyncStorage.setItem(HOME_CONFETTI_SHOWN_KEY, "true");
      })
      .catch(() => {
        if (active) setShowFirstHomeConfetti(true);
      });

    return () => {
      active = false;
    };
  }, [onboardingChecked, onboardingDone]);

  // Mientras carga la sesión o no hay usuario, no renderizamos contenido
  if (loading || !user || !onboardingChecked || !onboardingDone) return null;

  const handlePickMedia = async () => {
    if (!selectedPetId || !userId) return;
    setIsPickingMedia(true);

    try {
      const warningShown = await AsyncStorage.getItem("upload_warning_shown");
      if (!warningShown) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Contenido responsable",
            "La idea de la comunidad es subir contenido inspirador y divertido. El contenido violento o de maltrato puede causar bloqueo de tu cuenta.",
            [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Entendido", style: "default", onPress: () => resolve(true) },
            ]
          );
        });
        if (!proceed) return;
        await AsyncStorage.setItem("upload_warning_shown", "true");
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.9,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const mediaType =
        asset.type === "video" ? "video" : ("image" as const);

      if (mediaType === "video" && asset.duration) {
        const durationMs =
          asset.duration <= 120 ? asset.duration * 1000 : asset.duration;
        if (durationMs > 45_000) {
          Alert.alert(
            "Video muy largo",
            "El video debe durar máximo 45 segundos."
          );
          return;
        }
      }

      const maxBytes = 100 * 1024 * 1024;
      let fileSize = asset.fileSize ?? null;
      if (fileSize == null) {
        const info = await FileSystem.getInfoAsync(asset.uri);
        fileSize = info.exists ? info.size ?? null : null;
      }
      if (fileSize != null && fileSize > maxBytes) {
        Alert.alert(
          "Archivo muy pesado",
          "El archivo supera 100MB. Intenta con un video más liviano."
        );
        return;
      }

      let uploadUri = asset.uri;
      let uploadMimeType = asset.mimeType ?? undefined;
      if (mediaType === "image") {
        try {
          const actions = [];
          if (asset.width && asset.width > 1080) {
            actions.push({ resize: { width: 1080 } });
          }
          const manipulated = await ImageManipulator.manipulateAsync(
            asset.uri,
            actions,
            {
              compress: 0.3,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );
          uploadUri = manipulated.uri;
          uploadMimeType = "image/jpeg";
        } catch {
          // fallback to original
        }
      }

      let finalSize = fileSize;
      if (finalSize == null || uploadUri !== asset.uri) {
        const info = await FileSystem.getInfoAsync(uploadUri);
        finalSize = info.exists ? info.size ?? null : null;
      }

      if (
        finalSize != null &&
        mediaQuota?.remaining_bytes != null &&
        finalSize > mediaQuota.remaining_bytes
      ) {
        Alert.alert(
          "Cuota de almacenamiento excedida",
          `Te quedan ${formatBytes(mediaQuota.remaining_bytes)} de ${formatBytes(
            mediaQuota.bytes_limit
          )}. Borra contenido para continuar.`
        );
        return;
      }

      try {
        await mutateAsync({
          owner_user_id: userId,
          pet_id: selectedPetId,
          media_type: mediaType,
          local_uri: uploadUri,
          mime_type: uploadMimeType,
        });
      } catch (error: any) {
        const message = error?.message ?? "No se pudo subir el archivo.";
        const isTooLarge =
          message.toLowerCase().includes("too large") ||
          message.toLowerCase().includes("payload") ||
          message.toLowerCase().includes("exceed");
        const isQuotaExceeded =
          message.toLowerCase().includes("media_quota_exceeded") ||
          message.toLowerCase().includes("quota");
        Alert.alert(
          "Error al subir",
          isQuotaExceeded
            ? `Llegaste al limite de ${formatBytes(
                mediaQuota?.bytes_limit ?? 524288000
              )}. Borra fotos o videos para seguir subiendo.`
            : isTooLarge
            ? "El archivo supera 100MB. Intenta con un video más liviano."
            : message
        );
      }
    } finally {
      setIsPickingMedia(false);
    }
  };


  return (
    <View style={styles.container}>
      {isLoading && <Text style={styles.mutedText}>Cargando mascotas...</Text>}

      {!isLoading && safePets.length === 0 && (
        <Text style={styles.mutedText}>
          No tienes mascotas registradas. ¡Agrega una!
        </Text>
      )}

      {!isLoading && safePets.length > 0 && !selectedPet && (
        <Text style={styles.mutedText}>
          Selecciona una mascota desde el menú lateral.
        </Text>
      )}

      {!isLoading && selectedPet && (
        <>
          <View
            testID="pet_profile_card"
            style={styles.profileCard}
          >
            <Pressable
              onPress={() => router.push("/pet/edit")}
              style={styles.profileAvatar}
            >
              {selectedPet.avatar_signed_url ||
              (selectedPet.avatar_url?.startsWith("http")
                ? selectedPet.avatar_url
                : null) ? (
                <Image
                  source={{
                    uri:
                      selectedPet.avatar_signed_url ??
                      (selectedPet.avatar_url?.startsWith("http")
                        ? selectedPet.avatar_url
                        : "") ??
                      "",
                  }}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  style={styles.profileAvatarImage}
                />
              ) : (
                <Text style={styles.profileAvatarPlaceholder}>PET</Text>
              )}
            </Pressable>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {selectedPet.name}
              </Text>
              <Text style={styles.profileStatus}>
                {selectedPet.status ?? "Sin estado"}
              </Text>
              <View style={styles.profileStatsRow}>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>{petStats?.posts ?? 0}</Text>
                  <Text style={styles.profileStatLabel}>Publicaciones</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>
                    {petStats?.followers ?? 0}
                  </Text>
                  <Text style={styles.profileStatLabel}>Seguidores</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>
                    {petStats?.following ?? 0}
                  </Text>
                  <Text style={styles.profileStatLabel}>Siguiendo</Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/pet/edit")}
            style={styles.editProfileButton}
          >
            <Text style={styles.editProfileText}>Editar perfil</Text>
          </Pressable>
        </>
      )}

      {!isLoading && selectedPet && (
        <Pressable
          onPress={() => router.push("/pet/record")}
          style={styles.petDetailsButton}
        >
          <Text style={styles.petDetailsButtonText}>
            Ficha de {selectedPet.name}
          </Text>
        </Pressable>
      )}

      <View style={styles.sectionSpacer} />

      <View style={styles.galleryHeader}>
        <Text
          style={[
            styles.galleryTitle,
            { color: colorScheme === "dark" ? "#fff" : "#111" },
          ]}
        >
          Galería
        </Text>
        <Pressable
          onPress={handlePickMedia}
          disabled={isPending || isPickingMedia || !selectedPetId}
          style={[
            styles.uploadButton,
            (isPending || isPickingMedia || !selectedPetId) &&
              styles.uploadButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.uploadButtonText,
              { color: colorScheme === "dark" ? "#fff" : "#111" },
            ]}
          >
            +
          </Text>
        </Pressable>
      </View>
      {mediaQuota && (
        <Text style={styles.quotaText}>
          Uso de media: {formatBytes(mediaQuota.bytes_used)} /{" "}
          {formatBytes(mediaQuota.bytes_limit)} ({mediaQuota.usage_percent}%)
        </Text>
      )}

      {isPostsLoading && <ActivityIndicator />}

      {!isPostsLoading && (posts?.length ?? 0) === 0 && (
        <Text style={styles.mutedText}>No hay publicaciones todavía.</Text>
      )}

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.galleryRow}
        contentContainerStyle={styles.galleryContent}
        renderItem={({ item }) => (
          <View style={styles.galleryTile}>
            {item.media_type === "image" && item.media_url ? (
              <CachedMediaImage
                mediaUrl={item.media_url}
                cache={imageCache}
                setCache={setImageCache}
                onPress={() => setActivePost(item)}
              />
            ) : item.media_type === "video" ? (
              <VideoThumbnail
                postId={item.id}
                mediaUrl={item.media_url ?? undefined}
                thumbs={thumbs}
                setThumbs={setThumbs}
                onPress={() => {
                  setActivePost(item);
                }}
              />
            ) : (
              <View
                style={styles.galleryEmpty}
              >
                <Text style={styles.galleryEmptyText}>Sin media</Text>
              </View>
            )}
          </View>
        )}
      />

      {activePost?.media_type === "video" ? (
        <VideoModal
          post={activePost}
          isDeleting={isDeleting}
          onClose={() => setActivePost(null)}
          onDelete={async () => {
            await deletePostAsync({
              id: activePost.id,
              pet_id: activePost.pet_id,
              storage_bucket: activePost.storage_bucket,
              storage_path: activePost.storage_path,
            });
            setActivePost(null);
          }}
        />
      ) : (
        <ImageModal
          post={activePost}
          isDeleting={isDeleting}
          onClose={() => setActivePost(null)}
          onDelete={async () => {
            if (!activePost) return;
            await deletePostAsync({
              id: activePost.id,
              pet_id: activePost.pet_id,
              storage_bucket: activePost.storage_bucket,
              storage_path: activePost.storage_path,
            });
            setActivePost(null);
          }}
        />
      )}

      {(isPending || isPickingMedia) && (
        <View style={styles.screenSpinner}>
          <ActivityIndicator
            size="large"
            color={colorScheme === "dark" ? "#fff" : "#111"}
          />
        </View>
      )}

      {showFirstHomeConfetti && (
        <View pointerEvents="none" style={styles.confettiOverlay}>
          <LottieView
            source={require("../../../../assets/lottie/confetti_two_side.json")}
            autoPlay
            loop={false}
            onAnimationFinish={(isCancelled) => {
              if (!isCancelled) setShowFirstHomeConfetti(false);
            }}
            style={styles.confettiOverlayLottie}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 22, paddingTop: 10 },
  mutedText: { color: "#666" },
  profileCard: {
    padding: 11,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileAvatarImage: { width: 72, height: 72, borderRadius: 36 },
  profileAvatarPlaceholder: { fontWeight: "600", color: "#666" },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "700", color: "#111" },
  profileStatus: { fontSize: 14, color: "#666", marginBottom: 8 },
  profileStatsRow: { flexDirection: "row", justifyContent: "space-between" },
  profileStat: { alignItems: "center", flex: 1 },
  profileStatValue: { fontWeight: "600" },
  profileStatLabel: { color: "#666", fontSize: 12 },
  editProfileButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    marginBottom: 10,
  },
  editProfileText: { fontWeight: "600" },
  petInfoCard: {
    padding: 16,
    backgroundColor: "#eee",
    borderRadius: 12,
    marginBottom: 10,
  },
  petDetailsButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    marginBottom: 10,
  },
  petDetailsButtonText: { fontWeight: "600" },
  sectionSpacer: { height: 20 },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quotaText: {
    color: "#666",
    fontSize: 12,
    marginBottom: 8,
  },
  galleryTitle: { fontSize: 18, fontWeight: "600" },
  uploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  uploadButtonDisabled: { opacity: 0.6 },
  uploadButtonText: { color: "#111", fontWeight: "700", fontSize: 26 },
  galleryRow: { gap: 6 },
  galleryContent: { gap: 6, paddingBottom: 20 },
  galleryTile: {
    flex: 1 / 3,
    aspectRatio: 1,
    backgroundColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
  },
  galleryEmpty: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryEmptyText: { color: "#666" },
  screenSpinner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11,
  },
  confettiOverlayLottie: {
    width: "100%",
    height: "100%",
  },
});

function VideoThumbnail({
  postId,
  mediaUrl,
  thumbs,
  setThumbs,
  onPress,
}: {
  postId: string;
  mediaUrl?: string;
  thumbs: Record<string, string>;
  setThumbs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onPress: () => void;
}) {
  useEffect(() => {
    let active = true;

    async function loadThumbnail() {
      if (!mediaUrl || thumbs[postId]) return;
      try {
        const cachedUri = await getCachedThumbnail(mediaUrl);
        if (cachedUri) {
          if (active) {
            setThumbs((prev) => ({ ...prev, [postId]: cachedUri }));
          }
          return;
        }

        const { uri } = await VideoThumbnails.getThumbnailAsync(mediaUrl, {
          time: 1000,
        });
        const storedUri = await storeThumbnail(mediaUrl, uri);
        if (active) {
          setThumbs((prev) => ({
            ...prev,
            [postId]: storedUri ?? uri,
          }));
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
      <Pressable onPress={onPress} style={{ width: "100%", height: "100%" }}>
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>▶</Text>
          </View>
        </View>
      </Pressable>
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

function CachedMediaImage({
  mediaUrl,
  cache,
  setCache,
  onPress,
}: {
  mediaUrl: string;
  cache: Record<string, string>;
  setCache: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onPress?: () => void;
}) {
  useEffect(() => {
    let active = true;

    async function loadImage() {
      if (cache[mediaUrl]) return;
      const cachedUri = await getCachedMedia(mediaUrl);
      if (cachedUri) {
        if (active) {
          setCache((prev) => ({ ...prev, [mediaUrl]: cachedUri }));
        }
        return;
      }

      try {
        const storedUri = await storeMedia(mediaUrl);
        if (active) {
          setCache((prev) => ({
            ...prev,
            [mediaUrl]: storedUri ?? mediaUrl,
          }));
        }
      } catch {
        if (active) {
          setCache((prev) => ({ ...prev, [mediaUrl]: mediaUrl }));
        }
      }
    }

    loadImage();

    return () => {
      active = false;
    };
  }, [cache, mediaUrl, setCache]);

  const uri = cache[mediaUrl] ?? mediaUrl;

  const content = (
    <Image
      source={{ uri }}
      style={{ width: "100%", height: "100%" }}
      contentFit="cover"
    />
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ width: "100%", height: "100%" }}>
        {content}
      </Pressable>
    );
  }

  return content;
}

function hashString(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function getFileExtensionFromUrl(url: string) {
  const match = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? `.${match[1]}` : ".img";
}

async function getCachedThumbnail(mediaUrl: string) {
  const cacheDir = `${FileSystem.cacheDirectory}pet-thumbs/`;
  const fileName = `${hashString(mediaUrl)}.jpg`;
  const fileUri = `${cacheDir}${fileName}`;

  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists && info.size && info.size > 0) return fileUri;
  if (info.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }
  return null;
}

async function storeThumbnail(mediaUrl: string, sourceUri: string) {
  const cacheDir = `${FileSystem.cacheDirectory}pet-thumbs/`;
  const fileName = `${hashString(mediaUrl)}.jpg`;
  const fileUri = `${cacheDir}${fileName}`;

  try {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    await FileSystem.copyAsync({ from: sourceUri, to: fileUri });
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists && info.size && info.size > 0) return fileUri;
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    return null;
  } catch {
    return null;
  }
}

async function getCachedMedia(mediaUrl: string) {
  const cacheDir = `${FileSystem.cacheDirectory}pet-media/`;
  const fileName = `${hashString(mediaUrl)}${getFileExtensionFromUrl(mediaUrl)}`;
  const fileUri = `${cacheDir}${fileName}`;

  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists && info.size && info.size > 0) return fileUri;
  if (info.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }
  return null;
}

async function storeMedia(mediaUrl: string) {
  const cacheDir = `${FileSystem.cacheDirectory}pet-media/`;
  const fileName = `${hashString(mediaUrl)}${getFileExtensionFromUrl(mediaUrl)}`;
  const fileUri = `${cacheDir}${fileName}`;

  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  await FileSystem.downloadAsync(mediaUrl, fileUri);
  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists && info.size && info.size > 0) return fileUri;
  await FileSystem.deleteAsync(fileUri, { idempotent: true });
  return null;
}

function VideoModal({
  post,
  isDeleting,
  onClose,
  onDelete,
}: {
  post: PostWithMedia | null;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const url = post?.media_url ?? "";
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    if (url) p.play();
  });

  useEffect(() => {
    if (url) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, url]);

  return (
    <Modal visible={!!post} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture
          nativeControls
        />
        <View
          style={{
            position: "absolute",
            top: 40,
            right: 20,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Cerrar</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={isDeleting}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "rgba(220,20,60,0.8)",
              borderRadius: 8,
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {isDeleting ? "Borrando..." : "Borrar"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ImageModal({
  post,
  isDeleting,
  onClose,
  onDelete,
}: {
  post: PostWithMedia | null;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const url = post?.media_url ?? "";

  return (
    <Modal visible={!!post} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {url ? (
          <Image
            source={{ uri: url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Sin media
            </Text>
          </View>
        )}
        <View
          style={{
            position: "absolute",
            top: 40,
            right: 20,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Cerrar</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={isDeleting}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "rgba(220,20,60,0.8)",
              borderRadius: 8,
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {isDeleting ? "Borrando..." : "Borrar"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
