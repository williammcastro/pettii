import { useProductById } from "@/features/products/hooks";
import { formatMoneyFromCents } from "@/lib/currency";
import { useCartStore } from "@/store/cart";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function ProductDetailModal() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = typeof id === "string" ? id : undefined;
  const { data: product, isLoading } = useProductById(productId);
  const addItem = useCartStore((s) => s.addItem);
  const [imageLoading, setImageLoading] = useState(true);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>No se encontró el producto.</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Cerrar</Text>
        </Pressable>
      </View>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price_cents: product.price_cents ?? null,
      currency: product.currency,
    });
    Alert.alert("Agregado al carrito", "Puedes revisar tu carrito en Shop.");
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.dismissArea} onPress={() => router.back()}>
        <Text style={styles.closeText}>Cerrar</Text>
      </Pressable>

      <View style={styles.imageWrapper}>
        {product.image_signed_url || product.image_url ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image_signed_url ?? product.image_url ?? "" }}
              style={styles.image}
              contentFit="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <Text style={styles.imageLoadingText}>Cargando imagen...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
      </View>

      <View style={[styles.detailsCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.name}>{product.name}</Text>
        {product.description && (
          <Text style={styles.description}>{product.description}</Text>
        )}
        {product.category && (
          <Text style={styles.meta}>Categoria: {product.category}</Text>
        )}
        {product.price_cents != null && (
          <Text style={styles.price}>
            {formatMoneyFromCents(product.price_cents, product.currency)}
          </Text>
        )}
        {product.stock != null && (
          <Text style={styles.meta}>Cantidad disponible: {product.stock}</Text>
        )}

        <Pressable style={styles.buyButton} onPress={handleAddToCart}>
          <Text style={styles.buyText}>Agregar al carrito</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  dismissArea: {
    padding: 16,
    alignItems: "flex-end",
  },
  closeText: { color: "#fff", fontSize: 14 },
  imageWrapper: { flex: 1, justifyContent: "center" },
  imageContainer: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { width: "100%", height: "100%", backgroundColor: "#222" },
  imageLoadingOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  imageLoadingText: { color: "#fff", fontSize: 14 },
  detailsCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  name: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  description: { color: "#555", marginBottom: 8 },
  meta: { color: "#666", marginBottom: 6 },
  price: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  buyButton: {
    backgroundColor: "#222",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buyText: { color: "#fff", fontWeight: "600" },
  closeButton: {
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#222",
  },
});
