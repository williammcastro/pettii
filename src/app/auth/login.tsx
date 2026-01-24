import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      router.replace('/'); // home (tabs/index)
    } catch (e: any) {
      Alert.alert('Error inesperado', e.message ?? 'Intenta de nuevo');
    }
  };

  const goToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión en Pettii</Text>

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
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.primaryText}>Entrar</Text>
      </Pressable>

      <View style={{ height: 16 }} />

      <Pressable style={styles.secondaryButton} onPress={goToRegister}>
        <Text style={styles.secondaryText}>Crear cuenta</Text>
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
  secondaryButton: {
    backgroundColor: '#eee',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 16,
  },
});
