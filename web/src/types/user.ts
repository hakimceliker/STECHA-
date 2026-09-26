export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  locale: string;
  is_admin: boolean;
}

export interface UserProfile extends User {
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  locale?: string;
  password?: string;
}
