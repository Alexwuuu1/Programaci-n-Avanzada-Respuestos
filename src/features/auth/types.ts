export type UserRole = "Admin" | "Vendedor" | "Operario";

export interface UserSession {
  username: string;
  role: UserRole;
  employeeName?: string;
}
