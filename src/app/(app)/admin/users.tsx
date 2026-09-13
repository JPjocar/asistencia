import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createWorker, getWorkers, setWorkerActive } from '@/features/iam/service';
import type { Profile } from '@/features/iam/types';
import { useAuth } from '@/providers/auth-provider';

export default function UsersScreen() {
  const { profile, signOut } = useAuth();
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadWorkers() {
    try {
      setWorkers(await getWorkers());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo cargar la informacion.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadWorkers();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function handleCreate() {
    if (!email.trim() || password.length < 10) {
      setError('Ingresa un correo y una contrasena de al menos 10 caracteres.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createWorker(email, password);
      setEmail('');
      setPassword('');
      await loadWorkers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleWorker(worker: Profile) {
    setError(null);
    try {
      await setWorkerActive(worker.id, !worker.is_active);
      await loadWorkers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo actualizar la cuenta.');
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={workers}
        keyExtractor={worker => worker.id}
        ListEmptyComponent={isLoading ? <ActivityIndicator color="#111827" /> : <Text style={styles.empty}>No hay trabajadores registrados.</Text>}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.brand}>aspmax</Text>
            <Text style={styles.title}>Trabajadores</Text>
            <Text style={styles.subtitle}>Administrador: {profile?.email}</Text>

            <View style={styles.form}>
              <Text style={styles.formTitle}>Nueva cuenta</Text>
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
                autoComplete="new-password"
                onChangeText={setPassword}
                placeholder="Contrasena temporal"
                placeholderTextColor="#6B7280"
                secureTextEntry
                style={styles.input}
                value={password}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                disabled={isSubmitting}
                onPress={handleCreate}
                style={({ pressed }) => [styles.button, (pressed || isSubmitting) && styles.buttonPressed]}>
                {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Cuentas creadas</Text>
          </View>
        }
        refreshControl={<RefreshControl onRefresh={loadWorkers} refreshing={isLoading} />}
        renderItem={({ item }) => (
          <View style={styles.worker}>
            <View style={styles.workerInfo}>
              <Text numberOfLines={1} style={styles.workerEmail}>{item.email}</Text>
              <Text style={[styles.status, item.is_active ? styles.active : styles.inactive]}>
                {item.is_active ? 'Activa' : 'Desactivada'}
              </Text>
            </View>
            <Pressable onPress={() => toggleWorker(item)} style={styles.action}>
              <Text style={styles.actionText}>{item.is_active ? 'Desactivar' : 'Activar'}</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { paddingLeft: 16, paddingVertical: 8 },
  actionText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  active: { color: '#047857' },
  brand: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  button: { alignItems: 'center', backgroundColor: '#111827', borderRadius: 10, height: 46, justifyContent: 'center' },
  buttonPressed: { opacity: 0.75 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  container: { backgroundColor: '#FFFFFF', flex: 1 },
  content: { padding: 24, paddingBottom: 96 },
  empty: { color: '#6B7280', fontSize: 15, paddingVertical: 20, textAlign: 'center' },
  error: { color: '#B91C1C', fontSize: 14, lineHeight: 20 },
  form: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 28, padding: 16 },
  formTitle: { color: '#111827', fontSize: 16, fontWeight: '600' },
  header: { marginBottom: 14 },
  inactive: { color: '#B45309' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', borderRadius: 10, borderWidth: 1, color: '#111827', fontSize: 16, height: 46, paddingHorizontal: 12 },
  sectionTitle: { color: '#111827', fontSize: 17, fontWeight: '600', marginTop: 28 },
  signOut: { bottom: 12, left: 24, paddingVertical: 12, position: 'absolute' },
  signOutText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  status: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  subtitle: { color: '#6B7280', fontSize: 14, marginTop: 8 },
  title: { color: '#111827', fontSize: 28, fontWeight: '700', marginTop: 12 },
  worker: { alignItems: 'center', borderBottomColor: '#E5E7EB', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  workerEmail: { color: '#111827', fontSize: 15 },
  workerInfo: { flex: 1 },
});
