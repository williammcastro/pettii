import { useEffect } from "react";
import { QueryProvider } from "./QueryProvider";
import { useAuthStore } from "@/store/auth";
import { router, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

function AuthBootstrapper() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null;
}

function OnboardingGate() {
  const { loading } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      if (loading) return;
      const inOnboarding = segments[0] === "onboarding";
      const inAuth = segments[0] === "auth";
      if (inOnboarding || inAuth) return;
      const done = await AsyncStorage.getItem("onboarding_completed");
      if (!cancelled && !done) {
        router.replace("/onboarding/welcome");
      }
    }

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [loading, segments]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthBootstrapper />
      <OnboardingGate />
      {children}
    </QueryProvider>
  );
}
