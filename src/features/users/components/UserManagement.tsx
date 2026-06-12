import React, { useState, useEffect } from "react";
import type { UserRole } from "../../auth/types";
import {
  Shield, UserPlus, UserCheck, Trash2, X, Check, Loader2, Plus,
  Pencil, Eye, EyeOff, Power, Mail, Clock, AlertTriangle,
} from "lucide-react";
import { toast } from "../../../components/ui/Toast";

/* ─── Tipos ─── */
interface UserAccount {
  id: number;
  username: string;
  role: UserRole;
  employeeName: string;
  employeeId: number | null;
  email: string | null;
  status: "Activo" | "Inactivo";
  lastAccess: string | null;
  createdAt: string;
}

interface EmployeeOption {
  id: number;
  name: string;
  position: string;
}

/* ─── Helpers ─── */
const API = "/api";

const formatDate = (iso: string | null): string => {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return d.toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/* ─── Componente ─── */
export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* ─── Modal States ─── */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  /* ─── Form States (Create) ─── */
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Operario");
  const [newEmployeeId, setNewEmployeeId] = useState("");

  /* ─── Form States (Edit) ─── */
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("Operario");
  const [editEmployeeId, setEditEmployeeId] = useState("");

  /* ─── Fetch ─── */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API}/usuarios`);
      if (!response.ok) throw new Error("Error al obtener la lista de usuarios.");
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API}/empleados`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch { /* silenciar */ }
  };

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  /* ─── Abrir modales ─── */
  const openCreateModal = () => {
    setNewUsername("");
    setNewPassword("");
    setShowPassword(false);
    setNewEmail("");
    setNewRole("Operario");
    setNewEmployeeId("");
    setError("");
    setShowCreateModal(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditPassword("");
    setShowEditPassword(false);
    setEditEmail(user.email || "");
    setEditRole(user.role);
    setEditEmployeeId(user.employeeId?.toString() || "");
    setError("");
    setShowEditModal(true);
  };

  /* ─── Crear usuario ─── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }
    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      setError("El nombre de usuario ya existe.");
      return;
    }

    setError("");
    try {
      setActionLoading(true);
      const response = await fetch(`${API}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          roleName: newRole,
          employeeId: newEmployeeId || null,
          email: newEmail.trim() || null,
          password: newPassword.trim() || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al crear el usuario.");
      }

      await fetchUsers();
      setShowCreateModal(false);
      toast.success("¡Usuario creado exitosamente!");
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Editar usuario ─── */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError("");
    try {
      setActionLoading(true);
      const response = await fetch(`${API}/usuarios/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: editRole,
          employeeId: editEmployeeId || null,
          email: editEmail.trim() || null,
          password: editPassword.trim() || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al actualizar.");
      }

      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
      toast.success("¡Usuario actualizado!");
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Toggle Estado ─── */
  const handleToggle = async (user: UserAccount) => {
    const action = user.status === "Activo" ? "desactivar" : "activar";
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} al usuario "${user.username}"?`)) return;

    try {
      setActionLoading(true);
      const response = await fetch(`${API}/usuarios/${user.id}/toggle`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error);
      }
      await fetchUsers();
      toast.success(`El usuario "${user.username}" ha sido ${user.status === "Activo" ? "desactivado" : "activado"} correctamente.`);
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar el estado.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Eliminar ─── */
  const handleDelete = async (user: UserAccount) => {
    if (users.filter(u => u.status === "Activo").length <= 1 && user.status === "Activo") {
      toast.warning("No puedes eliminar al único usuario activo del sistema.");
      return;
    }
    if (!confirm(`¿Eliminar permanentemente al usuario "${user.username}"? Esta acción no se puede deshacer.`)) return;

    try {
      setActionLoading(true);
      const response = await fetch(`${API}/usuarios/${user.id}`, { method: "DELETE" });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "No se pudo eliminar el usuario.");
      }

      await fetchUsers();
      toast.success("¡Usuario eliminado del sistema!");
    } catch (err: any) {
      toast.error(err.message || "Error de conexión.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Shared: campo label ─── */
  const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{children}</label>
  );

  const InputClass = "w-full rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-semibold placeholder:text-muted-foreground/50";
  const SelectClass = "w-full rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 font-bold";

  /* ─── Render ─── */
  return (
    <div className="p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-5 sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuarios y Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administración de accesos, credenciales y estados del personal.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg uppercase tracking-wider transition-all active:scale-[0.98] self-start shadow-[0_2px_10px_rgba(0,149,255,0.25)]"
        >
          <Plus className="h-4 w-4" /> Registrar Usuario
        </button>
      </div>

      {error && !showCreateModal && !showEditModal && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ─── Tabla de Usuarios ─── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
          <UserCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Usuarios Registrados
            <span className="text-muted-foreground text-sm font-normal ml-2">({users.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="pb-3 pr-4">Usuario</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Empleado</th>
                <th className="pb-3 pr-4">Rol</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Último Acceso</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground uppercase tracking-widest">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={`hover:bg-muted/10 transition-all font-medium ${u.status === "Inactivo" ? "opacity-50" : ""}`}>
                    <td className="py-3.5 pr-4 font-bold text-primary text-sm">{u.username}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">
                      {u.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-primary/60" /> {u.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-foreground">{u.employeeName}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        u.role === "Admin"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : u.role === "Vendedor"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-green-500/10 border-green-500/20 text-green-400"
                      }`}>
                        <Shield className="h-3 w-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        u.status === "Activo"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}>
                        <Power className="h-3 w-3" />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary/40" />
                        {formatDate(u.lastAccess)}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(u)}
                          disabled={actionLoading}
                          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={actionLoading}
                          className={`p-1.5 rounded transition-all ${
                            u.status === "Activo"
                              ? "hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400"
                              : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400"
                          }`}
                          title={u.status === "Activo" ? "Desactivar usuario" : "Activar usuario"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={actionLoading}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════ MODAL CREAR USUARIO ═══════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-zoomIn">
            <div className="flex items-center gap-2 mb-5 border-b border-border pb-3 justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold uppercase tracking-wider text-foreground">Nuevo Usuario</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}

              {/* Row 1: Username + Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre de Usuario *</Label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ej: jgomez"
                    className={InputClass}
                    required
                  />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Auto si vacío"
                      className={InputClass + " pr-9"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">Vacío = usuario + "123"</p>
                </div>
              </div>

              {/* Row 2: Email */}
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    className={InputClass + " pl-9"}
                  />
                </div>
              </div>

              {/* Row 3: Employee + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empleado Asociado</Label>
                  <select
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    className={SelectClass}
                  >
                    <option value="" className="bg-card">— Sin asociar —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-card">
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Rol de Acceso *</Label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className={SelectClass}
                  >
                    <option value="Admin" className="bg-card">Administrador</option>
                    <option value="Vendedor" className="bg-card">Vendedor</option>
                    <option value="Operario" className="bg-card">Operario de Almacén</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-border rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(0,149,255,0.2)]"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL EDITAR USUARIO ═══════════════ */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-zoomIn">
            <div className="flex items-center gap-2 mb-5 border-b border-border pb-3 justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold uppercase tracking-wider text-foreground">
                  Editar: <span className="text-primary">{editingUser.username}</span>
                </h3>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}

              {/* Email */}
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    className={InputClass + " pl-9"}
                  />
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <Label>Nueva Contraseña</Label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar vacío para no cambiar"
                    className={InputClass + " pr-9"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {showEditPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">Vacío = sin cambio</p>
              </div>

              {/* Employee + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empleado Asociado</Label>
                  <select
                    value={editEmployeeId}
                    onChange={(e) => setEditEmployeeId(e.target.value)}
                    className={SelectClass}
                  >
                    <option value="" className="bg-card">— Sin asociar —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-card">
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Rol de Acceso</Label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className={SelectClass}
                  >
                    <option value="Admin" className="bg-card">Administrador</option>
                    <option value="Vendedor" className="bg-card">Vendedor</option>
                    <option value="Operario" className="bg-card">Operario de Almacén</option>
                  </select>
                </div>
              </div>

              {/* Info de estado */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className={`font-bold ${editingUser.status === "Activo" ? "text-emerald-400" : "text-red-400"}`}>
                    {editingUser.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último acceso:</span>
                  <span className="text-foreground font-medium">{formatDate(editingUser.lastAccess)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado:</span>
                  <span className="text-foreground font-medium">{formatDate(editingUser.createdAt)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="px-4 py-2.5 border border-border rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(0,149,255,0.2)]"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
