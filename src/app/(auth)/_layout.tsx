import { Redirect, Stack } from 'expo-router';

import { FullScreenLoader } from '@/components/full-screen-loader';
import { useAuth } from '@/providers/auth-provider';

export default function AuthLayout() {
  const { isLoading, profile } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (profile) {
    return <Redirect href={profile.role === 'admin' ? '/admin/users' : '/'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
