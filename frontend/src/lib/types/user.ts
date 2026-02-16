export type UserRole = 'volunteer' | 'first_responder' | 'admin' | 'affected_individual';

export type User = {
  id: string;
  display_name: string;
  email?: string;
  role_id: UserRole;
  created_at?: string;
  updated_at?: string;
  photo_url?: string | null;
};

export type UserCreate = {
  display_name: string;
  role_id: UserRole;
};

export type DisplayNameResponse = {
  display_name: string
};
