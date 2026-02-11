// src/app/(tabs)/index.tsx
import { usePrimaryClinic } from "@/features/clinics/hooks";
import { useProductsForPrimaryClinic } from "@/features/products/hooks";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ShopScreen() {
  const { user, loading } = useAuthStore();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const userId = user?.id;
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const {
    data: primaryClinic,
    isLoading: isClinicLoading,
    error: clinicError,
    refetch: refetchClinic,
  } = usePrimaryClinic(userId);

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
    } catch {
      // ignore refresh errors; UI will show query errors if any
    }
  };

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

  const handleCartPress = () => {
    router.push("/cart");
  };

  return (
    <View style={styles.container}>
      {hasPrimaryClinic && (
        <View style={styles.clinicHeader}>
          {primaryClinic?.logo_signed_url || primaryClinic?.logo_url ? (
            <Image
              source={{
                uri:
                  primaryClinic.logo_signed_url ??
                  primaryClinic.logo_url ??
                  "",
              }}
              style={styles.clinicLogo}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.clinicLogoPlaceholder} />
          )}
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>
              {primaryClinic?.name ?? "Veterinaria"}
            </Text>
            <Text style={styles.clinicSlogan}>
              {primaryClinic?.slogan ?? "Tu clinica de confianza"}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable style={styles.cartButton} onPress={handleCartPress}>
          <MaterialIcons name="shopping-cart" size={24} color="#111" />
          <Text style={styles.cartCount}>{cartCount}</Text>
        </Pressable>
        <Pressable
          style={styles.cartButton}
          onPress={() => router.push("/orders")}
        >
          <MaterialIcons name="receipt-long" size={24} color="#111" />
          <Text style={styles.cartCount}>Mis pedidos</Text>
        </Pressable>
      </View>

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

      {isClinicLoading && <Text>Cargando ...</Text>}

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
              <Pressable onPress={() => router.push(`/product/${item.id}`)}>
                {item.image_signed_url || item.image_url ? (
                  <Image
                    source={{ uri: item.image_signed_url ?? item.image_url ?? "" }}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder} />
                )}
              </Pressable>
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
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  cartCount: { color: "#111", fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  meta: { color: "#666", marginBottom: 12 },
  errorText: { color: "#c0392b", marginBottom: 10 },
  clinicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    marginBottom: 16,
  },
  clinicLogo: { width: 70, height: 70, borderRadius: 35 },
  clinicLogoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e0e0e0",
  },
  clinicInfo: { flex: 1 },
  clinicName: { fontSize: 18, fontWeight: "600" },
  clinicSlogan: { color: "#666", marginTop: 4, fontSize: 14 },
  gridContent: { paddingBottom: 24 },
  gridRow: { justifyContent: "flex-start", gap: 6, marginBottom: 12 },
  productCard: {
    width: "32.5%",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    minHeight: 110,
  },
  productImage: { width: "100%", height: 110, borderRadius: 8, marginBottom: 8 },
  productImagePlaceholder: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },
  productName: { fontSize: 14, fontWeight: "600" },
  productDescription: { color: "#666", marginTop: 4, fontSize: 12 },
  productPrice: { marginTop: 8, fontSize: 12 },
});
