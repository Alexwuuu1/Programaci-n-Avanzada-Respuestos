import React, { useState } from "react";
import type { UserSession, UserRole } from "../types";
import { KeyRound, User, Flame } from "lucide-react";

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor, ingresa tu usuario y contraseña.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/autenticacion/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Credenciales incorrectas.");
      }

      const session: UserSession = await response.json();
      localStorage.setItem("userSession", JSON.stringify(session));
      onLogin(session);
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const prefill = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setUsername(selectedRole.toLowerCase());
    setPassword(selectedRole.toLowerCase() + "123");
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Flame className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            REPUESTOS LA PAZ
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Control de Producción e Inventarios
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="-space-y-px rounded-md shadow-sm">
            <div className="relative mb-3">
              <User className="absolute top-3 left-3 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                className="w-full rounded-md border border-border bg-input py-2.5 pr-3 pl-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="relative mb-4">
              <KeyRound className="absolute top-3 left-3 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full rounded-md border border-border bg-input py-2.5 pr-3 pl-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-border bg-background/50 p-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Seleccionar Rol de Acceso:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["Admin", "Vendedor", "Operario"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => prefill(r)}
                  className={`rounded py-1.5 text-xs font-medium border transition-all ${
                    role === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-input text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Ingresar al Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
};
