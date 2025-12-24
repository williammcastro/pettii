// src/app/(tabs)/index.tsx
import { useProductsForPrimaryClinic } from "@/features/products/hooks";
import { useAuthStore } from "@/store/auth";
import { usePetSelectionStore } from "@/store/pet-selection";
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function ShopScreen() {
  const { user, loading } = useAuthStore();
  const userId = user?.id;
  const selectedPetId = usePetSelectionStore((s) => s.selectedPetId);
  const { data: products, isLoading } = useProductsForPrimaryClinic(userId);

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
        Catálogo de productos
      </Text>

      {user.email && (
        <Text style={{ color: "#666", marginBottom: 12 }}>
          Usuario seleccionado: {user.email}
        </Text>
      )}

      {user.id && (
        <Text style={{ color: "#666", marginBottom: 12 }}>
          ID Usuario seleccionado: {user.id}
        </Text>
      )}

      {selectedPetId && (
        <Text style={{ color: "#666", marginBottom: 12 }}>
          Mascota seleccionada: {selectedPetId}
        </Text>
      )}

      {products && (
        <Text style={{ color: "#666", marginBottom: 12 }}>
          Catalogo seleccionado: {products.length} productos
        </Text>
      )}

      {isLoading && <Text>Cargando productos...</Text>}

      {!isLoading && (products?.length ?? 0) === 0 && (
        <Text>No hay productos disponibles.</Text>
      )}

      {!isLoading &&
        products?.map((product) => (
          <View
            key={product.id}
            style={{
              padding: 14,
              borderRadius: 10,
              backgroundColor: "#f2f2f2",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {product.name}
            </Text>
            {product.description && (
              <Text style={{ color: "#666", marginTop: 4 }}>
                {product.description}
              </Text>
            )}
            {product.price_cents != null && (
              <Text style={{ marginTop: 6 }}>
                {product.currency} {(product.price_cents / 100).toFixed(2)}
              </Text>
            )}
            {product.price_cents != null && (
              <Text style={{ marginTop: 6 }}>
                Clinic id: {product.clinic_id}
              </Text>
            )}
          </View>
        ))}
    </View>
  );
}
