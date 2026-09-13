export type UserRole = 'admin' | 'worker';

export type Profile = {
  email: string;
  id: string;
  is_active: boolean;
  role: UserRole;
};

export type SignInCredentials = {
  email: string;
  password: string;
};
