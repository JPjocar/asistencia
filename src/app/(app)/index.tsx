import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function WorkerHomeScreen() {
  const { profile, signOut } = useAuth();

  if (profile?.role === 'admin') {
    return <Redirect href="/admin/users" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>aspmax</Text>
        <Text style={styles.title}>Hello world</Text>
        <Text style={styles.subtitle}>{profile?.email}</Text>
      </View>
      <Pressable onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  container: { backgroundColor: '#FFFFFF', flex: 1, justifyContent: 'space-between', padding: 24 },
  content: { gap: 10, marginTop: 56 },
  signOut: { alignSelf: 'flex-start', paddingVertical: 12 },
  signOutText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  subtitle: { color: '#6B7280', fontSize: 15 },
  title: { color: '#111827', fontSize: 28, fontWeight: '700' },
});
