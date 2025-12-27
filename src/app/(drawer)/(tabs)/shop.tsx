// src/app/(tabs)/index.tsx
import { useJoinClinicByCode, usePrimaryClinic } from "@/features/clinics/hooks";
import { useProductsForPrimaryClinic } from "@/features/products/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ShopScreen() {
  const { user, loading } = useAuthStore();
  const userId = user?.id;
  const selectedPetId = usePetSelectionStore((s) => s.selectedPetId);
  const {
    data: primaryClinic,
    isLoading: isClinicLoading,
    error: clinicError,
    refetch: refetchClinic,
  } = usePrimaryClinic(userId);
  const { mutateAsync: joinClinic, isPending: isJoining } = useJoinClinicByCode(userId);
  const [clinicCode, setClinicCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const hasPrimaryClinic = !!primaryClinic?.id;
  const {
    data: products,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProductsForPrimaryClinic(userId, hasPrimaryClinic);

  const handleRefresh = async () => {
    try {
      await refetchClinic();
      await refetchProducts();
    } catch (e: any) {
      // ignore refresh errors; UI will show query errors if any
    }
  };

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

  const handleJoinClinic = async () => {
    const normalized = clinicCode.trim();
    if (!normalized) {
      setJoinError("Ingresa el código de tu veterinaria.");
      return;
    }

    setJoinError(null);
    try {
      await joinClinic(normalized);
      setClinicCode("");
      await refetchClinic();
      await refetchProducts();
      Alert.alert("Listo", "Veterinaria vinculada.");
    } catch (e: any) {
      const message =
        e?.message ?? "No se pudo vincular la veterinaria. Intenta de nuevo.";
      setJoinError(message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Catálogo de productos
      </Text>

      {/* {user.email && (
        <Text style={styles.meta}>
          Usuario seleccionado: {user.email}
        </Text>
      )}

      {user.id && (
        <Text style={styles.meta}>
          ID Usuario seleccionado: {user.id}
        </Text>
      )}

      {selectedPetId && (
        <Text style={styles.meta}>
          Mascota seleccionada: {selectedPetId}
        </Text>
      )} */}

      {isClinicLoading && <Text>Cargando veterinaria...</Text>}

      {!isClinicLoading && (
        <View style={styles.joinCard}>
          <Text style={styles.joinTitle}>
            {hasPrimaryClinic ? "Cambiar veterinaria" : "Vincula tu veterinaria"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Código de veterinaria"
            autoCapitalize="characters"
            value={clinicCode}
            onChangeText={setClinicCode}
          />
          {joinError && <Text style={styles.errorText}>{joinError}</Text>}
          <Button
            title={isJoining ? "Vinculando..." : "Vincular"}
            onPress={handleJoinClinic}
            disabled={isJoining}
          />
        </View>
      )}

      {hasPrimaryClinic && (
        <Text style={styles.meta}>
          {primaryClinic?.name ?? "Sin nombre"} (
          {primaryClinic?.code ?? "sin código"})
          {/* {primaryClinic?.id} */}
        </Text>
      )}

      {products && hasPrimaryClinic && (
        <Text style={styles.meta}>
          {products.length} productos
        </Text>
      )}

      {clinicError && (
        <Text style={styles.errorText}>
          Error al cargar veterinaria: {(clinicError as any)?.message ?? clinicError}
        </Text>
      )}

      {productsError && (
        <Text style={styles.errorText}>
          Error al cargar productos: {(productsError as any)?.message ?? productsError}
        </Text>
      )}

      {isProductsLoading && <Text>Cargando productos...</Text>}

      {!isProductsLoading && hasPrimaryClinic && (
        <FlatList
          data={products ?? []}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl
              refreshing={isClinicLoading || isProductsLoading}
              onRefresh={handleRefresh}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              {item.image_signed_url || item.image_url ? (
                <Image
                  source={{ uri: item.image_signed_url ?? item.image_url ?? "" }}
                  style={styles.productImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder} />
              )}
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              {item.description && (
                <Text style={styles.productDescription} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
              {item.price_cents != null && (
                <Text style={styles.productPrice}>
                  {item.currency} {(item.price_cents / 100).toFixed(2)}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={<Text>No hay productos disponibles.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  meta: { color: "#666", marginBottom: 12 },
  joinCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
    marginBottom: 16,
  },
  joinTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  errorText: { color: "#c0392b", marginBottom: 10 },
  gridContent: { paddingBottom: 24 },
  gridRow: { justifyContent: "space-between", marginBottom: 12 },
  productCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    marginHorizontal: 4,
    minHeight: 110,
  },
  productImage: { width: "100%", height: 70, borderRadius: 8, marginBottom: 8 },
  productImagePlaceholder: {
    width: "100%",
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },
  productName: { fontSize: 14, fontWeight: "600" },
  productDescription: { color: "#666", marginTop: 4, fontSize: 12 },
  productPrice: { marginTop: 8, fontSize: 12 },
});
