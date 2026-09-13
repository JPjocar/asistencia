import { Redirect, Stack } from 'expo-router';

import { FullScreenLoader } from '@/components/full-screen-loader';
import { useAuth } from '@/providers/auth-provider';

export default function AppLayout() {
  const { isLoading, profile } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!profile) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShadowVisible: false }} />;
}
