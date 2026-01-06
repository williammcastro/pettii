import { useOrdersForUser } from "@/features/orders/hooks";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

function formatStatus(status: string) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "confirmed":
      return "Confirmado";
    case "delivered":
      return "Entregado";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}

export default function OrdersModal() {
  const { user, loading } = useAuthStore();
  const userId = user?.id;
  const { data: orders, isLoading } = useOrdersForUser(userId);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis pedidos</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeText}>Cerrar</Text>
        </Pressable>
      </View>
      {isLoading && <Text>Cargando pedidos...</Text>}

      {!isLoading && (orders?.length ?? 0) === 0 && (
        <Text style={styles.muted}>No tienes pedidos aún.</Text>
      )}

      {orders?.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <Text style={styles.orderTitle}>Pedido #{order.id.slice(0, 8)}</Text>
          <Text style={styles.orderStatus}>
            Estado: {formatStatus(order.status)}
          </Text>
          <Text style={styles.orderMeta}>
            {order.currency} {(order.total_cents / 100).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "600" },
  closeText: { color: "#333" },
  muted: { color: "#666" },
  orderCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  orderTitle: { fontWeight: "600", marginBottom: 6 },
  orderStatus: { color: "#444", marginBottom: 4 },
  orderMeta: { color: "#666" },
});
