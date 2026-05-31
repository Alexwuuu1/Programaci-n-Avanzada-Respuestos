import React, { useState } from "react";
import type { UserRole } from "../../auth/types";
import { Shield, UserPlus, UserCheck, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface UserAccount {
  id: number;
  username: string;
  role: UserRole;
  employeeName: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Operario");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/usuarios");
      if (!response.ok) throw new Error("Error al obtener la lista de usuarios.");
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmployeeName.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      setError("El nombre de usuario ya existe.");
      return;
    }

    setError("");
    try {
      const response = await fetch("http://localhost:3000/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          roleName: newRole,
          employeeName: newEmployeeName.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al crear el usuario.");
      }

      const createdUser: UserAccount = await response.json();
      setUsers([...users, createdUser]);
      setNewUsername("");
      setNewEmployeeName("");
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (users.length <= 1) {
      alert("No puedes eliminar a todos los usuarios del sistema.");
      return;
    }
    if (!confirm("¿Estás seguro de eliminar este usuario?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "No se pudo eliminar el usuario.");
      }

      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message || "Error de conexión.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios y Roles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administración de accesos de personal y roles del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de Nuevo Usuario */}
        <div className="rounded-xl border border-border bg-card p-6 h-fit">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Nuevo Usuario</h3>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            {error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">{error}</div>}
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Usuario</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="ej: jgomez"
                className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Empleado a Asociar</label>
              <input
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="ej: Jorge Gómez"
                className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Rol en el Sistema</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="Admin">Administrador</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Operario">Operario de Almacén</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all active:scale-[0.98]"
            >
              Crear Cuenta
            </button>
          </form>
        </div>

        {/* Tabla de Usuarios Registrados */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Usuarios Activos</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3">Usuario</th>
                  <th className="pb-3">Empleado</th>
                  <th className="pb-3">Rol</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      Cargando usuarios de la base de datos...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="text-sm">
                      <td className="py-3 font-semibold text-foreground">{u.username}</td>
                      <td className="py-3 text-muted-foreground">{u.employeeName}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === "Admin"
                            ? "bg-primary/10 border-primary text-primary"
                            : u.role === "Vendedor"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : "bg-green-500/10 border-green-500/30 text-green-400"
                        }`}>
                          <Shield className="h-3 w-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded bg-destructive/10 border border-transparent hover:border-destructive/20 text-destructive transition-all hover:bg-destructive/20"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
