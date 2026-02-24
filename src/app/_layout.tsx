import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from "expo-image";
import { useEffect, useState } from "react";
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DynamicLaunchScreen } from "@/components/dynamic-launch-screen";
import { fetchPrimaryClinicForUser } from "@/features/clinics/api";
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  clearCachedClinicLogoUrl,
  getCachedClinicLogoUrl,
  setCachedClinicLogoUrl,
} from "@/lib/clinic-branding-cache";
import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from "@/store/auth";

export const unstable_settings = {
  anchor: '(drawer)',
};

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuthStore();
  const [launchReady, setLaunchReady] = useState(false);
  const [launchLogoUrl, setLaunchLogoUrl] = useState<string | null>(null);
  const [showDynamicLaunch, setShowDynamicLaunch] = useState(false);

  useEffect(() => {
    if (loading || launchReady) return;

    let active = true;

    const loadLaunchScreen = async () => {
      if (!user?.id) {
        await SplashScreen.hideAsync().catch(() => undefined);
        if (!active) return;
        setLaunchReady(true);
        return;
      }

      const cachedLogoUrl = await getCachedClinicLogoUrl(user.id);
      if (cachedLogoUrl) {
        await ExpoImage.prefetch(cachedLogoUrl).catch(() => undefined);
        if (active) {
          setLaunchLogoUrl(cachedLogoUrl);
          setShowDynamicLaunch(true);
        }

        await SplashScreen.hideAsync().catch(() => undefined);
        if (!active) return;

        setTimeout(() => {
          if (active) setLaunchReady(true);
        }, 450);

        // Refrescamos en background para próximas aperturas sin bloquear arranque.
        void (async () => {
          const clinic = await fetchPrimaryClinicForUser(user.id).catch(() => null);
          const latestLogoUrl = clinic?.logo_signed_url ?? clinic?.logo_url ?? null;
          if (!active) return;
          if (latestLogoUrl) {
            await setCachedClinicLogoUrl(user.id, latestLogoUrl);
            setLaunchLogoUrl(latestLogoUrl);
          } else {
            await clearCachedClinicLogoUrl(user.id);
          }
        })();
        return;
      }

      // Sin caché: resolvemos logo remoto antes de mostrar app.
      const clinic = await fetchPrimaryClinicForUser(user.id).catch(() => null);
      const latestLogoUrl = clinic?.logo_signed_url ?? clinic?.logo_url ?? null;

      if (latestLogoUrl) {
        await setCachedClinicLogoUrl(user.id, latestLogoUrl);
        await ExpoImage.prefetch(latestLogoUrl).catch(() => undefined);
        if (active) {
          setLaunchLogoUrl(latestLogoUrl);
          setShowDynamicLaunch(true);
        }
      } else {
        await clearCachedClinicLogoUrl(user.id);
      }

      await SplashScreen.hideAsync().catch(() => undefined);
      if (!active) return;

      setTimeout(() => {
        if (active) setLaunchReady(true);
      }, latestLogoUrl ? 450 : 0);
    };

    void loadLaunchScreen();

    return () => {
      active = false;
    };
  }, [launchReady, loading, user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {!launchReady && showDynamicLaunch ? (
            <DynamicLaunchScreen logoUrl={launchLogoUrl} />
          ) : launchReady ? (
            <Stack>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen
                name="pet/edit"
                options={{ presentation: "modal", title: "Editar perfil" }}
              />
              <Stack.Screen
                name="pet/record"
                options={{ presentation: "modal", title: "Ficha de la mascota" }}
              />
              <Stack.Screen
                name="cart"
                options={{ presentation: "modal", title: "Carrito" }}
              />
              <Stack.Screen
                name="orders"
                options={{ presentation: "modal", title: "Mis pedidos" }}
              />
              <Stack.Screen
                name="pet/[id]"
                options={{
                  title: "Perfil de mascota",
                  headerBackButtonDisplayMode: "minimal",
                }}
              />
              <Stack.Screen
                name="product/[id]"
                options={{ presentation: "modal", headerShown: false }}
              />
            </Stack>
          ) : null}
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
