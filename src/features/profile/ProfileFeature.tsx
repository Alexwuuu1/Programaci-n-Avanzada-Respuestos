import React, { useState, useEffect } from "react";
import type { UserSession, UserRole } from "../auth/types";
import {
  User, Shield, Mail, Phone, Clock, Lock, Eye, EyeOff,
  Loader2, Check, MapPin, Calendar, Award, Activity,
  FileText, CheckCircle, AlertCircle, AlertTriangle, ShieldAlert
} from "lucide-react";
import { toast } from "../../components/ui/Toast";

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

interface Employee {
  id: number;
  name: string;
  ci: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  position: string;
  shift: string | null;
  salary: number | null;
  birthDate: string | null;
  hireDate: string | null;
  emergencyContact: string | null;
  notes: string | null;
  status: "Activo" | "Inactivo";
  createdAt: string;
}

interface AttendanceLog {
  id: string;
  employeeId: number;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number | null;
}

interface ProfileFeatureProps {
  session: UserSession;
}

const API = "/api";

export const ProfileFeature: React.FC<ProfileFeatureProps> = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Data States
  const [user, setUser] = useState<UserAccount | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  
  // UI States
  const [showSalary, setShowSalary] = useState(false);
  
  // Password Form States
  const [emailField, setEmailField] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch all users to find the logged-in user profile details and ID
      const usersRes = await fetch(`${API}/usuarios`);
      if (!usersRes.ok) throw new Error("No se pudo obtener la información de usuarios.");
      const usersList: UserAccount[] = await usersRes.ok ? await usersRes.json() : [];
      
      const matchedUser = usersList.find(
        (u) => u.username.toLowerCase() === session.username.toLowerCase()
      );

      if (!matchedUser) {
        throw new Error("No se encontró el perfil del usuario activo.");
      }

      setUser(matchedUser);
      setEmailField(matchedUser.email || "");

      // 2. Fetch employee details if linked
      let matchedEmp: Employee | null = null;
      if (matchedUser.employeeId) {
        const empRes = await fetch(`${API}/empleados`);
        if (empRes.ok) {
          const empList: Employee[] = await empRes.json();
          matchedEmp = empList.find((e) => e.id === matchedUser.employeeId) || null;
          setEmployee(matchedEmp);
        }
      }

      // 3. Fetch sales & production orders for statistics
      const [salesRes, prodRes] = await Promise.all([
        fetch(`${API}/ventas`),
        fetch(`${API}/produccion`)
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProductionOrders(prodData);
      }

      // 4. Load attendance logs from localStorage and filter for this employee
      const savedLogs = localStorage.getItem("employee_attendance_logs");
      if (savedLogs) {
        try {
          const parsedLogs: AttendanceLog[] = JSON.parse(savedLogs);
          // Filter logs matching current employee
          const filtered = parsedLogs
            .filter((log) => {
              if (matchedUser.employeeId) {
                return log.employeeId === matchedUser.employeeId;
              }
              return log.employeeName.toLowerCase() === session.employeeName?.toLowerCase();
            })
            .sort((a, b) => new Date(`${b.date}T${b.clockIn}`).getTime() - new Date(`${a.date}T${a.clockIn}`).getTime())
            .slice(0, 10); // Show last 10 entries

          setAttendance(filtered);
        } catch (e) {
          console.error("Error al procesar logs de asistencia:", e);
        }
      }

    } catch (err: any) {
      setError(err.message || "Error cargando los datos del perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormError("");

    // Validation
    if (newPassword || confirmPassword) {
      if (newPassword.length < 4) {
        setFormError("La nueva contraseña debe tener al menos 4 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError("Las contraseñas nuevas no coinciden.");
        return;
      }
    }

    try {
      setFormLoading(true);
      const response = await fetch(`${API}/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailField.trim() || null,
          password: newPassword ? newPassword.trim() : undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "No se pudo actualizar el perfil.");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      
      // Clear password fields
      newPassword && setNewPassword("");
      confirmPassword && setConfirmPassword("");
      
      toast.success("¡Credenciales actualizadas exitosamente!");
    } catch (err: any) {
      setFormError(err.message || "Error al conectar con la base de datos.");
    } finally {
      setFormLoading(false);
    }
  };

  // Helper date formatter
  const formatLocalDate = (iso: string | null): string => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  /* ─── Math metrics based on user role ─── */
  const renderStats = () => {
    if (!user) return null;

    const cargoLow = employee?.position.toLowerCase() || "";
    const isSales = session.role === "Vendedor" || cargoLow.includes("vendedor") || cargoLow.includes("venta") || cargoLow.includes("caja");
    const isProd = session.role === "Operario" || cargoLow.includes("operario") || cargoLow.includes("torno") || cargoLow.includes("fundi");

    if (session.role === "Admin") {
      // Admin dashboard metrics
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Award className="h-5 w-5 text-purple-400" />
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Control de Plataforma</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-center">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Cuentas Activas</span>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                {sales.length > 0 ? "Dashboard" : "Cargando..."}
                <span className="text-xs text-purple-300 block font-semibold mt-1">Acceso Completo</span>
              </p>
            </div>
            
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Acciones Operativas</span>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                OK
                <span className="text-xs text-blue-300 block font-semibold mt-1">Servicios Estables</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">Nivel de Credencial:</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-[10px] uppercase">Super Admin</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">Base de Datos:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Conectado (Prisma)
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (isSales) {
      // Seller statistics
      const employeeName = employee?.name || user.employeeName;
      const employeeSales = sales.filter(s => s.sellerName && (
        s.sellerName.toLowerCase() === employeeName.toLowerCase() || 
        employeeName.toLowerCase().includes(s.sellerName.toLowerCase()) ||
        s.sellerName.toLowerCase().includes(employeeName.toLowerCase())
      ));
      const totalSalesVal = employeeSales.reduce((acc, s) => acc + Number(s.total), 0);
      const commission = totalSalesVal * 0.10;

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Award className="h-5 w-5 text-blue-400 animate-pulse" />
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-foreground font-mono">Rendimiento de Ventas (Este Mes)</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Ventas Realizadas</span>
              <p className="text-2xl font-black text-foreground tracking-tight">{employeeSales.length}</p>
              <span className="text-[10px] text-muted-foreground font-medium block mt-1">Transacciones facturadas</span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Volumen Vendido</span>
              <p className="text-2xl font-black text-foreground tracking-tight">Bs. {totalSalesVal.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-muted-foreground font-medium block mt-1">Facturación total bruta</span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-primary/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Comisión Acumulada</span>
              <span className="text-[11px] text-muted-foreground">Calculado al 10% del total</span>
            </div>
            <p className="text-2xl font-black text-emerald-400 tracking-tight">
              Bs. {commission.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }

    if (isProd) {
      // Production statistics
      const empId = employee?.id || user.employeeId || 0;
      const completed = productionOrders.filter(o => {
        const respId = o.responsibleId || o.responsableId;
        return Number(respId) === empId && o.status === "Finalizado";
      });
      const incentive = completed.length * 20;

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Award className="h-5 w-5 text-green-400 animate-pulse" />
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-foreground font-mono">Eficiencia de Producción</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest block mb-1">Órdenes Completadas</span>
              <p className="text-2xl font-black text-foreground tracking-tight">{completed.length}</p>
              <span className="text-[10px] text-muted-foreground font-medium block mt-1">Tareas finalizadas en taller</span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Bono por Orden</span>
              <p className="text-2xl font-black text-foreground tracking-tight">Bs. 20.00</p>
              <span className="text-[10px] text-muted-foreground font-medium block mt-1">Tarifa incentivo fija</span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider block">Incentivos Acumulados</span>
              <span className="text-[11px] text-muted-foreground">Pago por rendimiento</span>
            </div>
            <p className="text-2xl font-black text-emerald-400 tracking-tight">
              Bs. {incentive.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }

    // Default or unlinked view
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center space-y-3">
        <ShieldAlert className="h-10 w-10 text-yellow-500 mx-auto" />
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Estadísticas No Disponibles</h4>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Esta cuenta de usuario no se encuentra vinculada a ninguna ficha técnica de personal de ventas o producción.
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Cargando expediente de perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 flex items-center gap-3 text-destructive max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Error de Carga</h4>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const InputClass = "w-full rounded-lg bg-muted/40 border border-border px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-semibold placeholder:text-muted-foreground/50";
  const LabelClass = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="p-6 space-y-6">
      {/* ─── Banner Cockpit de Perfil ─── */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center shadow-lg">
        {/* Glow Decorator */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-[50px] -z-10" />
        
        {/* Avatar */}
        <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-0.5 shadow-[0_0_20px_rgba(0,149,255,0.4)] flex-shrink-0">
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center text-foreground font-black text-2xl tracking-tighter">
            {session.username.substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* User Base Info */}
        <div className="text-center md:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">{session.employeeName || session.username}</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              session.role === "Admin"
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                : session.role === "Vendedor"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : "bg-green-500/10 border-green-500/20 text-green-400"
            }`}>
              <Shield className="h-3 w-3" />
              {session.role}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-semibold flex items-center justify-center md:justify-start gap-1">
            <User className="h-3.5 w-3.5 text-primary/60" /> Cuenta: <span className="text-foreground font-bold">{session.username}</span>
            {user?.email && (
              <>
                <span className="text-muted-foreground/30 mx-1">|</span>
                <Mail className="h-3.5 w-3.5 text-primary/60" /> {user.email}
              </>
            )}
          </p>
        </div>

        <div className="bg-muted/10 border border-border rounded-xl px-5 py-3 text-center flex-shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Último Acceso</span>
          <span className="text-xs text-foreground font-bold font-mono">
            {user?.lastAccess ? new Date(user.lastAccess).toLocaleDateString("es-BO", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
            }) : "Primera sesión"}
          </span>
        </div>
      </div>

      {/* ─── Grid de Columnas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Ficha Técnica Expediente (Toma 2 columnas en lg) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ficha Técnica de Expediente */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6 relative">
            <div className="flex items-center gap-2 border-b border-border pb-3 justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground uppercase tracking-wider">Expediente Laboral de Personal</h3>
              </div>
              {!employee && (
                <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Sin Ficha
                </span>
              )}
            </div>

            {employee ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold block">Cédula de Identidad (CI):</span>
                  <p className="text-foreground font-bold">{employee.ci || "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold block">Cargo / Puesto:</span>
                  <p className="text-foreground font-bold">{employee.position}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold block">Teléfono de Contacto:</span>
                  <p className="text-foreground font-bold flex items-center gap-1">
                    <Phone className="h-3 w-3 text-primary/60" /> {employee.phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold block">Turno Asignado:</span>
                  <p className="text-foreground font-bold">{employee.shift || "Sin asignar"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-muted-foreground font-semibold block">Dirección Particular:</span>
                  <p className="text-foreground font-bold flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary/60" /> {employee.address || "No registrada"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold block">Fecha de Contratación:</span>
                  <p className="text-foreground font-bold flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary/60" /> {formatLocalDate(employee.hireDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold block">Contacto de Emergencia:</span>
                  <p className="text-foreground font-bold">{employee.emergencyContact || "—"}</p>
                </div>
                
                {/* Salario Ocultable */}
                <div className="space-y-1 md:col-span-2 border-t border-border pt-4 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground font-semibold block">Salario Básico Mensual:</span>
                    <p className="text-lg font-black tracking-tight text-foreground mt-0.5">
                      {showSalary ? (
                        <span className="text-primary font-mono">
                          Bs. {employee.salary ? employee.salary.toLocaleString("es-BO", { minimumFractionDigits: 2 }) : "0.00"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 tracking-widest font-mono">••••••</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSalary(!showSalary)}
                    className="p-2 border border-border rounded-lg bg-muted/40 hover:bg-muted hover:text-foreground transition-all flex items-center justify-center"
                    title={showSalary ? "Ocultar salario" : "Mostrar salario"}
                  >
                    {showSalary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/10 p-5 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-foreground">Cuenta sin Ficha Laboral</h4>
                  <p className="text-muted-foreground">
                    Esta cuenta de usuario no tiene vinculada una ficha de empleado en el sistema. Los datos de salario, turnos, dirección e historial de asistencia no se podrán desplegar.
                  </p>
                  <p className="text-muted-foreground/80 mt-1">
                    Contacte al administrador de sistemas para realizar la vinculación desde el módulo de <strong>Empleados</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Asistencia */}
          {employee && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-wider">Historial de Asistencia Personal</h3>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  (Últimos 10 registros)
                </span>
              </div>

              {attendance.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">Sin marcaciones registradas</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Las marcaciones que realices en el reloj de asistencia aparecerán aquí.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border font-bold text-muted-foreground uppercase tracking-widest text-[9px]">
                        <th className="pb-2">Fecha</th>
                        <th className="pb-2">Entrada</th>
                        <th className="pb-2">Salida</th>
                        <th className="pb-2 text-right">Horas Totales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attendance.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/10">
                          <td className="py-2.5 font-bold text-foreground">
                            {new Date(log.date + "T00:00:00").toLocaleDateString("es-BO", {
                              weekday: "short", day: "2-digit", month: "short"
                            })}
                          </td>
                          <td className="py-2.5 text-emerald-400 font-mono font-bold">{log.clockIn}</td>
                          <td className="py-2.5 text-amber-400 font-mono font-bold">{log.clockOut || "—"}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-foreground">
                            {log.totalHours !== null ? `${log.totalHours.toFixed(1)} hrs` : "En curso"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Columna Derecha: Estadísticas y Formulario Credenciales */}
        <div className="space-y-6">
          
          {/* Tarjeta de Estadísticas de Rol */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-md">
            {renderStats()}
          </div>

          {/* Formulario de Cambio de Credenciales */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Credenciales de Acceso</h3>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              <div>
                <label className={LabelClass}>Email Comercial</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="email"
                    value={emailField}
                    onChange={(e) => setEmailField(e.target.value)}
                    placeholder="correo@empresa.com"
                    className={InputClass + " pl-9"}
                  />
                </div>
              </div>

              <div>
                <label className={LabelClass}>Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Escribe la nueva contraseña"
                    className={InputClass + " pr-9"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={LabelClass}>Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma la nueva contraseña"
                    className={InputClass + " pr-9"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(0,149,255,0.2)]"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Actualizar Datos
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
