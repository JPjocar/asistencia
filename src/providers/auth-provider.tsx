import { createContext, use, useEffect, useState } from 'react';

import { getProfile, signInWithPassword, signOut as endSession } from '@/features/iam/service';
import type { Profile, SignInCredentials } from '@/features/iam/types';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  isLoading: boolean;
  profile: Profile | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function syncProfile(userId: string) {
      try {
        const nextProfile = await getProfile(userId);
        if (!nextProfile.is_active) {
          await supabase.auth.signOut();
          if (isMounted) {
            setProfile(null);
          }
          return;
        }

        if (isMounted) {
          setProfile(nextProfile);
        }
      } catch {
        await supabase.auth.signOut();
        if (isMounted) {
          setProfile(null);
        }
      }
    }

    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await syncProfile(data.session.user.id);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void syncProfile(session.user.id);
      } else if (isMounted) {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signIn(credentials: SignInCredentials) {
    const { user } = await signInWithPassword(credentials);
    const nextProfile = await getProfile(user.id);

    if (!nextProfile.is_active) {
      await supabase.auth.signOut();
      throw new Error('Esta cuenta esta desactivada. Contacta al administrador.');
    }

    setProfile(nextProfile);
  }

  async function signOut() {
    await endSession();
    setProfile(null);
  }

  return <AuthContext value={{ isLoading, profile, signIn, signOut }}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
