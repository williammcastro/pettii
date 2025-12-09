// Zustand store for managing authentication state with Supabase
// src/store/auth.ts

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initAuth: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  initAuth: async () => {
    const { initialized } = get();
    if (initialized) return;

    set({ initialized: true, loading: true });

    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
