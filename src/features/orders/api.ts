import { supabase } from "@/lib/supabase";

type OrderItemInput = {
  product_id: string;
  quantity: number;
  price_cents: number;
  currency: string;
};

export async function createOrderWithItems(input: {
  user_id: string;
  clinic_id: string;
  total_cents: number;
  currency: string;
  delivery_address: string;
  delivery_phone: string;
  items: OrderItemInput[];
}) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: input.user_id,
      clinic_id: input.clinic_id,
      total_cents: input.total_cents,
      currency: input.currency,
      delivery_address: input.delivery_address,
      delivery_phone: input.delivery_phone,
      status: "pending",
      payment_method: "cash_on_delivery",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const itemsPayload = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_cents: item.price_cents,
    currency: item.currency,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsPayload);

  if (itemsError) throw itemsError;

  return order;
}

export type Order = {
  id: string;
  clinic_id: string;
  status: string;
  payment_method: string;
  total_cents: number;
  currency: string;
  delivery_address: string;
  delivery_phone: string;
  created_at: string;
};

export async function fetchOrdersForUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
