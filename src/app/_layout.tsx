import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProviders } from '@/providers/AppProviders';

export const unstable_settings = {
  anchor: '(drawer)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen
              name="clinic/change"
              options={{ presentation: "modal", title: "Cambiar veterinaria" }}
            />
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
              name="product/[id]"
              options={{ presentation: "modal", headerShown: false }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
