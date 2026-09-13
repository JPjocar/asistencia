import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

import type { Profile, SignInCredentials } from './types';

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, is_active')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('No se pudo validar el acceso de esta cuenta.');
  }

  return data as Profile;
}

export async function signInWithPassword({ email, password }: SignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error('Correo o contrasena incorrectos.');
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error('No se pudo cerrar la sesion.');
  }
}

export async function createWorker(email: string, password: string) {
  const { error } = await supabase.functions.invoke('iam-manage-user', {
    body: {
      action: 'create',
      email: email.trim().toLowerCase(),
      password,
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const details = await error.context.json().catch(() => null);
      if (details?.code === 'email_exists') {
        throw new Error('Ese correo ya tiene una cuenta.');
      }
    }

    throw new Error('No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.');
  }
}

export async function setWorkerActive(userId: string, isActive: boolean) {
  const { error } = await supabase.functions.invoke('iam-manage-user', {
    body: {
      action: 'set-active',
      isActive,
      userId,
    },
  });

  if (error) {
    throw new Error('No se pudo actualizar el estado de la cuenta.');
  }
}

export async function getWorkers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, is_active')
    .eq('role', 'worker')
    .order('email');

  if (error) {
    throw new Error('No se pudo cargar el listado de trabajadores.');
  }

  return data as Profile[];
}
