import React, { useState } from "react";
import type { UserSession, UserRole } from "../types";
import { KeyRound, User, Flame, ShieldCheck, ShoppingBag, Wrench, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "../../../components/ui/Toast";

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      triggerError("Por favor, ingresa tu usuario y contraseña.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/autenticacion/login", {
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
      toast.success(`¡Bienvenido de nuevo, ${session.employeeName}!`);
    } catch (err: any) {
      triggerError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    toast.error(msg);
    setTimeout(() => setShake(false), 500);
  };

  const prefill = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setUsername(selectedRole.toLowerCase());
    setPassword(selectedRole.toLowerCase() + "123");
    setError("");
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-background overflow-hidden bg-grid-moving px-4 py-12 sm:px-6 lg:px-8">
      {/* Dynamic Background Glowing Spheres */}
      <div className="absolute top-1/4 left-1/4 h-[250px] w-[250px] rounded-full bg-primary/10 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Cybernetic Login Card */}
      <div className={`w-full max-w-lg space-y-6 rounded-2xl p-8 glass-login animate-zoomIn transition-all duration-300 ${
        shake ? "animate-shake border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.2)]" : "border-white/5"
      }`}>
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_20px_rgba(0,149,255,0.4)]">
            <Flame className="h-8 w-8 animate-pulse text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-widest text-foreground uppercase mt-4">
              REPUESTOS LA PAZ
            </h2>
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/15 border border-primary/20 px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
              Control de Producción e Inventarios
            </span>
          </div>
        </div>

        {/* Action Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-bold uppercase tracking-wide text-center animate-fadeIn">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="relative group">
              <User className="absolute top-3 left-3.5 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de Usuario"
                className="w-full rounded-xl border border-border bg-input/40 py-3 pr-3 pl-11 text-xs text-foreground placeholder-muted-foreground/60 focus:border-primary/80 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-semibold"
              />
            </div>
            
            <div className="relative group">
              <KeyRound className="absolute top-3 left-3.5 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña del Sistema"
                className="w-full rounded-xl border border-border bg-input/40 py-3 pr-10 pl-11 text-xs text-foreground placeholder-muted-foreground/60 focus:border-primary/80 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role selector (Quick prefill cards) */}
          <div className="space-y-2 border-t border-border/45 pt-4">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
              Acceso Rápido de Prueba (Prefill)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { r: "Admin" as UserRole, label: "Administrador", icon: <ShieldCheck className="h-4.5 w-4.5" />, color: "border-primary/30 text-primary hover:bg-primary/5" },
                { r: "Vendedor" as UserRole, label: "Ventas / Caja", icon: <ShoppingBag className="h-4.5 w-4.5" />, color: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5" },
                { r: "Operario" as UserRole, label: "Fábrica / Stock", icon: <Wrench className="h-4.5 w-4.5" />, color: "border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/5" },
              ].map((item) => (
                <button
                  key={item.r}
                  type="button"
                  onClick={() => prefill(item.r)}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 border text-center transition-all hover-scale active-shrink cursor-pointer ${
                    role === item.r
                      ? `${role === "Admin" ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(0,149,255,0.25)] text-primary" : role === "Vendedor" ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.25)] text-emerald-400" : "border-yellow-500 bg-yellow-500/10 shadow-[0_0_12px_rgba(234,179,8,0.25)] text-yellow-500"}`
                      : "border-border/60 bg-input/20 text-muted-foreground"
                  }`}
                >
                  <div className="mb-1.5">{item.icon}</div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide leading-none">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-3.5 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 shadow-[0_4px_20px_rgba(0,149,255,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando Acceso...
              </>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
