// src/app/(tabs)/index.tsx
import { useAuthStore } from '@/store/auth';
import { usePetSelectionStore } from '@/store/pet-selection';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function ShopScreen() {
  const { user, loading } = useAuthStore();
  const selectedPetId = usePetSelectionStore((s) => s.selectedPetId);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    // mientras hace el replace
    return null;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Shop Screen</Text>
      {selectedPetId && <Text>Mascota seleccionada: {selectedPetId}</Text>}
    </View>
  );
}
