// src/types/auth.ts
// Si ya tienes este archivo, asegúrate de que incluya estos tipos.
// Si no, créalo con este contenido.

export type UserRole = "admin" | "empleado";

export interface AuthSession {
  token: string | null;
  role: UserRole | null;
}