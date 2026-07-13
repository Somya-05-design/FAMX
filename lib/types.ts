export type UserRole = "CLIENT" | "ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Session {
  user: SessionUser;
}
