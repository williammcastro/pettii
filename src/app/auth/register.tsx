import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const nextPath = typeof params.next === "string" ? params.next : "/";
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://pettii.com/verified",
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Listo', 'Cuenta creada. Ahora por favor revisa tu email y confirma tu cuenta antes de iniciar sesión.\nSi no ves el email, revisa tu carpeta de spam.');
      router.replace({
        pathname: "/auth/login",
        params: { next: nextPath },
      });
    } catch (e: any) {
      Alert.alert('Error inesperado', e.message ?? 'Intenta de nuevo');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryButton} onPress={handleRegister}>
        <Text style={styles.primaryText}>Registrarme</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
