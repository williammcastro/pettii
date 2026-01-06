import { usePrimaryClinic } from "@/features/clinics/hooks";
import { useCreateOrder } from "@/features/orders/hooks";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function CartModal() {
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const clearCart = useCartStore((s) => s.clear);
  const userId = user?.id;
  const { data: primaryClinic } = usePrimaryClinic(userId);
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.price_cents == null) return sum;
      return sum + item.price_cents * item.quantity;
    }, 0);
  }, [items]);
  const currency = items.find((item) => item.currency)?.currency ?? "COP";

  const handleOrder = () => {
    if (items.length === 0) return;
    if (!userId || loading) return;
    if (!primaryClinic?.id) {
      setError("Primero vincula una veterinaria.");
      return;
    }
    if (!address.trim()) {
      setError("Ingresa una direccion de entrega.");
      return;
    }
    if (!phone.trim()) {
      setError("Ingresa un telefono de contacto.");
      return;
    }

    setError(null);
    Alert.alert(
      "Confirmar orden",
      "¿Quieres ordenar y pagar contra entrega?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: async () => {
            try {
              await createOrder({
                user_id: userId,
                clinic_id: primaryClinic.id,
                total_cents: total,
                currency,
                delivery_address: address.trim(),
                delivery_phone: phone.trim(),
                items: items
                  .filter((item) => item.price_cents != null)
                  .map((item) => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                    price_cents: item.price_cents ?? 0,
                    currency: item.currency,
                  })),
              });
              clearCart();
              Alert.alert("Orden creada", "La veterinaria recibio tu pedido.");
              router.back();
            } catch (e: any) {
              Alert.alert(
                "Error",
                e?.message ?? "No se pudo crear la orden. Intenta de nuevo."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Math.max(insets.top, 12)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Tu carrito</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {items.length === 0 ? (
              <Text style={styles.muted}>Aun no tienes productos en el carrito.</Text>
            ) : (
              <View style={styles.items}>
                {items.map((item) => (
                  <View key={item.productId} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>
                        {item.quantity} x {item.name}
                      </Text>
                      {item.price_cents != null && (
                        <Text style={styles.itemPrice}>
                          {item.currency} {(item.price_cents / 100).toFixed(2)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.counter}>
                      <Pressable
                        style={styles.counterButton}
                        onPress={() => decrementItem(item.productId)}
                      >
                        <Text style={styles.counterText}>-</Text>
                      </Pressable>
                      <Text style={styles.counterValue}>{item.quantity}</Text>
                      <Pressable
                        style={styles.counterButton}
                        onPress={() =>
                          addItem({
                            productId: item.productId,
                            name: item.name,
                            price_cents: item.price_cents,
                            currency: item.currency,
                          })
                        }
                      >
                        <Text style={styles.counterText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.form}>
              <Text style={styles.formLabel}>Direccion de entrega</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Calle 123 #45-67"
                value={address}
                onChangeText={setAddress}
              />
              <Text style={styles.formLabel}>Telefono de contacto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 3001234567"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {currency} {(total / 100).toFixed(2)}
              </Text>
            </View>
          </ScrollView>

          <Pressable
            style={[
              styles.orderButton,
              (items.length === 0 || isPending) && styles.orderDisabled,
            ]}
            onPress={handleOrder}
            disabled={items.length === 0 || isPending}
          >
            <Text style={styles.orderText}>
              {isPending ? "Procesando..." : "Ordenar y pagar contra entrega"}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "600" },
  closeText: { color: "#333" },
  muted: { color: "#666" },
  items: { flex: 1 },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 16, fontWeight: "500" },
  itemPrice: { color: "#555", marginTop: 4 },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: { fontSize: 16, fontWeight: "600" },
  counterValue: { minWidth: 18, textAlign: "center", fontWeight: "600" },
  form: { marginTop: 16 },
  formLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  errorText: { color: "#c0392b", marginBottom: 8 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: { fontSize: 16, fontWeight: "600" },
  totalValue: { fontSize: 16, fontWeight: "600" },
  orderButton: {
    marginTop: 16,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  orderDisabled: {
    backgroundColor: "#bbb",
  },
  orderText: { color: "#fff", fontWeight: "600" },
});
