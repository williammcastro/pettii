import { fetchActiveAppVersionRule } from "@/features/app-update/api";
import { useAuthStore } from "@/store/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { router, useSegments } from "expo-router";
import { useEffect } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { QueryProvider } from "./QueryProvider";

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

function parseBuildNumber(value?: string | number | null): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCurrentBuildNumber(): number {
  const isExpoGo =
    Constants.executionEnvironment === "storeClient" ||
    Constants.appOwnership === "expo";

  if (isExpoGo) {
    if (Platform.OS === "ios") {
      return parseBuildNumber(Constants.expoConfig?.ios?.buildNumber);
    }
    if (Platform.OS === "android") {
      return parseBuildNumber(Constants.expoConfig?.android?.versionCode);
    }
  }

  const nativeBuild = parseBuildNumber(Application.nativeBuildVersion);
  if (nativeBuild > 0) return nativeBuild;

  if (Platform.OS === "ios") {
    return parseBuildNumber(Constants.expoConfig?.ios?.buildNumber);
  }
  if (Platform.OS === "android") {
    return parseBuildNumber(Constants.expoConfig?.android?.versionCode);
  }

  return 0;
}

function ForceUpdateGate() {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const currentBuild = getCurrentBuildNumber();
  const nativeBuildRaw = Application.nativeBuildVersion ?? null;
  const iosConfigBuild = Constants.expoConfig?.ios?.buildNumber ?? null;
  const androidConfigBuild = Constants.expoConfig?.android?.versionCode ?? null;

  const { data: rule } = useQuery({
    queryKey: ["app-version-rule", platform],
    queryFn: () => fetchActiveAppVersionRule(platform),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const mustUpdate =
    !!rule?.force_update &&
    currentBuild > 0 &&
    rule.min_build > currentBuild;

  useEffect(() => {
    console.log("[force-update] platform:", platform);
    console.log("[force-update] nativeBuildVersion(raw):", nativeBuildRaw);
    console.log("[force-update] ios buildNumber (expoConfig):", iosConfigBuild);
    console.log(
      "[force-update] android versionCode (expoConfig):",
      androidConfigBuild
    );
    console.log("[force-update] currentBuild(parsed):", currentBuild);
    console.log("[force-update] rule from db:", rule ?? null);
    console.log("[force-update] mustUpdate:", mustUpdate);
  }, [
    platform,
    nativeBuildRaw,
    iosConfigBuild,
    androidConfigBuild,
    currentBuild,
    rule,
    mustUpdate,
  ]);

  if (!mustUpdate || !rule) return null;

  return (
    <View style={styles.forceUpdateOverlay}>
      <View style={styles.forceUpdateCard}>
        <Text style={styles.forceUpdateTitle}>
          {rule.title || "Actualizacion requerida"}
        </Text>
        <Text style={styles.forceUpdateMessage}>
          {rule.message ||
            "Cambios importantes! Por favor actualiza la app para continuar."}
        </Text>
        <Pressable
          style={styles.forceUpdateButton}
          onPress={() => {
            void Linking.openURL(rule.store_url);
          }}
        >
          <Text style={styles.forceUpdateButtonText}>Actualizar app</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthBootstrapper />
      <OnboardingGate />
      {children}
      <ForceUpdateGate />
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  forceUpdateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  forceUpdateCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    padding: 20,
    gap: 12,
    backgroundColor: "#fff",
  },
  forceUpdateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  forceUpdateMessage: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  forceUpdateButton: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#111",
    paddingVertical: 12,
    alignItems: "center",
  },
  forceUpdateButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
