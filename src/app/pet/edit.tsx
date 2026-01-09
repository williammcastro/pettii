import { usePetById, useUpdatePetProfile } from "@/features/pets/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function EditPetProfileModal() {
  const { user, loading } = useAuthStore();
  const petId = usePetSelectionStore((s) => s.selectedPetId);
  const { data: pet } = usePetById(petId ?? undefined);
  const { mutateAsync: updatePet, isPending } = useUpdatePetProfile(user?.id);
  const [status, setStatus] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pet?.status != null && status.length === 0) {
      setStatus(pet.status);
    }
    if (!avatarPreview && (pet?.avatar_signed_url || pet?.avatar_url)) {
      setAvatarPreview(pet.avatar_signed_url ?? pet.avatar_url ?? null);
    }
  }, [pet?.status, pet?.avatar_signed_url, pet?.avatar_url, status.length, avatarPreview]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user]);


  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user || !petId) {
    return null;
  }

  const pickAvatar = async () => {
    const { status: permission } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission !== "granted") {
      Alert.alert("Permisos", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    try {
      const actions = [];
      if (asset.width && asset.width > 256) {
        actions.push({ resize: { width: 256 } });
      }
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        actions,
        {
          compress: 0.3,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      setAvatarPreview(manipulated.uri);
      setAvatarPath(manipulated.uri);
      setAvatarBase64(null);
    } catch {
      setAvatarPreview(asset.uri);
      setAvatarPath(asset.uri);
      setAvatarBase64(asset.base64 ?? null);
    }
  };

  const handleSave = async () => {
    if (!petId) return;
    setError(null);

    let avatar_url: string | undefined;
    if (avatarPath) {
      try {
        const fileName = `avatar_${Date.now()}.jpg`;
        const storagePath = `${petId}/${fileName}`;
        
        const base64 =
          avatarBase64 ??
          (await FileSystem.readAsStringAsync(avatarPath, {
            encoding: FileSystem.EncodingType.Base64,
          }));
        const fileBody = decode(base64);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("pet_media")
          .upload(storagePath, fileBody, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) throw uploadError;
        avatar_url = storagePath;
      } catch (e: any) {
        setError(e?.message ?? "No se pudo subir la imagen.");
        return;
      }
    }

    try {
      await updatePet({
        pet_id: petId,
        status: status.trim() ? status.trim() : null,
        avatar_url,
      });
      Alert.alert("Listo", "Perfil actualizado.");
      router.back();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo actualizar el perfil.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar perfil</Text>

      <Pressable style={styles.avatarButton} onPress={pickAvatar}>
        <View style={styles.avatarCircle}>
          {avatarPreview ? (
            <Image
              source={{ uri: avatarPreview }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>PET</Text>
          )}
        </View>
        <Text style={styles.avatarHint}>Cambiar imagen</Text>
      </Pressable>

      <Text style={styles.label}>Estado</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Jugando en el parque"
        value={status}
        onChangeText={setStatus}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        style={[styles.saveButton, isPending && styles.saveDisabled]}
        onPress={handleSave}
        disabled={isPending}
      >
        <Text style={styles.saveText}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  avatarButton: { alignItems: "center", marginBottom: 16 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { color: "#666", fontWeight: "600" },
  avatarHint: { marginTop: 8, color: "#444" },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  errorText: { color: "#c0392b", marginBottom: 10 },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveDisabled: { backgroundColor: "#bbb" },
  saveText: { color: "#fff", fontWeight: "600" },
});
