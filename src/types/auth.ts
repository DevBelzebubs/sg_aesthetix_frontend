export type UserRole = "admin" | "empleado";

export type AuthSession = {
  token: string | null;
  role: UserRole | null;
};
