import { create } from "zustand";

type CartItem = {
  productId: string;
  name: string;
  price_cents: number | null;
  currency: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry
          ),
        };
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }],
      };
    }),
  decrementItem: (productId) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.productId === productId);
      if (!existing) return state;
      if (existing.quantity <= 1) {
        return {
          items: state.items.filter((entry) => entry.productId !== productId),
        };
      }
      return {
        items: state.items.map((entry) =>
          entry.productId === productId
            ? { ...entry, quantity: entry.quantity - 1 }
            : entry
        ),
      };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((entry) => entry.productId !== productId),
    })),
  clear: () => set({ items: [] }),
}));
