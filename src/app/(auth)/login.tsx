import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contrasena.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo iniciar sesion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>aspmax</Text>
        <Text style={styles.title}>Iniciar sesion</Text>
        <Text style={styles.subtitle}>Accede a tu cuenta de asistencia.</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Correo electronico"
          placeholderTextColor="#6B7280"
          style={styles.input}
          value={email}
        />
        <TextInput
          autoComplete="current-password"
          onChangeText={setPassword}
          onSubmitEditing={handleSubmit}
          placeholder="Contrasena"
          placeholderTextColor="#6B7280"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={({ pressed }) => [styles.button, (pressed || isSubmitting) && styles.buttonPressed]}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: { color: '#111827', fontSize: 28, fontWeight: '700', letterSpacing: -1 },
  button: { alignItems: 'center', backgroundColor: '#111827', borderRadius: 10, height: 48, justifyContent: 'center', marginTop: 8 },
  buttonPressed: { opacity: 0.75 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  card: { gap: 14, maxWidth: 380, padding: 24, width: '100%' },
  container: { alignItems: 'center', backgroundColor: '#FFFFFF', flex: 1, justifyContent: 'center', padding: 24 },
  error: { color: '#B91C1C', fontSize: 14, lineHeight: 20 },
  input: { borderColor: '#D1D5DB', borderRadius: 10, borderWidth: 1, color: '#111827', fontSize: 16, height: 48, paddingHorizontal: 14 },
  subtitle: { color: '#6B7280', fontSize: 15, marginBottom: 10 },
  title: { color: '#111827', fontSize: 22, fontWeight: '600', marginTop: 22 },
});
