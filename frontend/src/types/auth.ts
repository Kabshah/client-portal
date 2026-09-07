export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  role: UserRole;
  created_at: string;
};

export type AuthMeResponse = {
  user: User;
};
