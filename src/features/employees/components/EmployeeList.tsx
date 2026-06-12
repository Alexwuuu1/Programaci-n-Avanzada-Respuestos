import React, { useState, useEffect } from "react";
import {
  Users, UserPlus, Phone, Briefcase, Plus, X, Check, Loader2,
  Pencil, Power, Mail, MapPin, CreditCard, Calendar, Clock,
  AlertTriangle, DollarSign, Contact, Trash2, FileSpreadsheet, Printer
} from "lucide-react";
import { toast } from "../../../components/ui/Toast";
import { exportarAExcel } from "../../../utils/exportUtils";
import { imprimirReporteA4 } from "../../finances/utils/printUtils";
import { formatMoney } from "../../../lib/formatters";

/* ─── Tipos ─── */
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

/* ─── Helpers ─── */
const API = "/api";
const InputClass = "w-full rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-semibold placeholder:text-muted-foreground/50";
const SelectClass = "w-full rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 font-bold";

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{children}</label>
);

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

/* ─── Componente Principal ─── */
export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* Tabs Navigation */
  const [activeSubTab, setActiveSubTab] = useState<"fichas" | "asistencia" | "comisiones">("fichas");

  /* Modales CRUD Fichas */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  /* Create form state */
  const [fName, setFName] = useState("");
  const [fCi, setFCi] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fPosition, setFPosition] = useState("");
  const [fShift, setFShift] = useState("");
  const [fSalary, setFSalary] = useState("");
  const [fBirth, setFBirth] = useState("");
  const [fHire, setFHire] = useState("");
  const [fEmergency, setFEmergency] = useState("");
  const [fNotes, setFNotes] = useState("");

  /* Edit form state */
  const [eName, setEName] = useState("");
  const [eCi, setECi] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eAddress, setEAddress] = useState("");
  const [ePosition, setEPosition] = useState("");
  const [eShift, setEShift] = useState("");
  const [eSalary, setESalary] = useState("");
  const [eBirth, setEBirth] = useState("");
  const [eHire, setEHire] = useState("");
  const [eEmergency, setEEmergency] = useState("");
  const [eNotes, setENotes] = useState("");

  /* ─── Asistencia States ─── */
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [selectedAttEmpId, setSelectedAttEmpId] = useState<string>("");
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attTime, setAttTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [attType, setAttType] = useState<"entrada" | "salida">("entrada");
  const [filterAttEmpId, setFilterAttEmpId] = useState<string>("Todos");

  /* ─── Comisiones States ─── */
  const [sales, setSales] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [selectedMonth] = useState<string>(new Date().toLocaleString("es-BO", { month: "long", year: "numeric" }).toUpperCase());
  const [commissionLoading, setCommissionLoading] = useState(false);

  /* ─── Fetch Employees ─── */
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/empleados`);
      if (!res.ok) throw new Error("Error al obtener empleados.");
      const data = await res.json();
      setEmployees(data);
      if (data.length > 0) {
        setSelectedAttEmpId(String(data[0].id));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Load LocalStorage logs for Attendance ─── */
  const loadAttendanceLogs = () => {
    const saved = localStorage.getItem("employee_attendance_logs");
    if (saved) {
      try {
        setAttendanceLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar marcaciones:", e);
      }
    }
  };

  /* ─── Load Sales & Production for Commissions ─── */
  const fetchCommissionsData = async () => {
    try {
      setCommissionLoading(true);
      const [salesRes, prodRes] = await Promise.all([
        fetch(`${API}/ventas`),
        fetch(`${API}/produccion`)
      ]);
      
      if (salesRes.ok) {
        setSales(await salesRes.json());
      }
      if (prodRes.ok) {
        setProductionOrders(await prodRes.json());
      }
    } catch (e) {
      console.error("Error al cargar datos financieros/producción:", e);
    } finally {
      setCommissionLoading(false);
    }
  };

  useEffect(() => { 
    fetchEmployees(); 
    loadAttendanceLogs();
  }, []);

  useEffect(() => {
    if (activeSubTab === "comisiones") {
      fetchCommissionsData();
    }
  }, [activeSubTab]);

  /* ─── Abrir Modales ─── */
  const openCreate = () => {
    setFName(""); setFCi(""); setFEmail(""); setFPhone(""); setFAddress("");
    setFPosition(""); setFShift(""); setFSalary(""); setFBirth(""); setFHire("");
    setFEmergency(""); setFNotes(""); setError("");
    setShowCreateModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setEName(emp.name); setECi(emp.ci || ""); setEEmail(emp.email || "");
    setEPhone(emp.phone); setEAddress(emp.address || ""); setEPosition(emp.position);
    setEShift(emp.shift || ""); setESalary(emp.salary?.toString() || "");
    setEBirth(emp.birthDate ? emp.birthDate.split("T")[0] : "");
    setEHire(emp.hireDate ? emp.hireDate.split("T")[0] : "");
    setEEmergency(emp.emergencyContact || ""); setENotes(emp.notes || "");
    setError("");
    setShowEditModal(true);
  };

  /* ─── CRUD Action Handlers ─── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fPhone.trim() || !fPosition.trim()) {
      setError("Nombre, teléfono y cargo son obligatorios.");
      return;
    }
    setError("");
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/empleados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fName.trim(), ci: fCi.trim() || null, email: fEmail.trim() || null,
          phone: fPhone.trim(), address: fAddress.trim() || null, position: fPosition.trim(),
          shift: fShift || null, salary: fSalary ? parseFloat(fSalary) : null,
          birthDate: fBirth || null, hireDate: fHire || null,
          emergencyContact: fEmergency.trim() || null, notes: fNotes.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchEmployees();
      setShowCreateModal(false);
      toast.success("¡Empleado registrado exitosamente!");
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    if (!eName.trim() || !ePhone.trim() || !ePosition.trim()) {
      setError("Nombre, teléfono y cargo son obligatorios.");
      return;
    }
    setError("");
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/empleados/${editingEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eName.trim(), ci: eCi.trim() || null, email: eEmail.trim() || null,
          phone: ePhone.trim(), address: eAddress.trim() || null, position: ePosition.trim(),
          shift: eShift || null, salary: eSalary ? parseFloat(eSalary) : null,
          birthDate: eBirth || null, hireDate: eHire || null,
          emergencyContact: eEmergency.trim() || null, notes: eNotes.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchEmployees();
      setShowEditModal(false); setEditingEmp(null);
      toast.success("¡Empleado actualizado!");
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (emp: Employee) => {
    const action = emp.status === "Activo" ? "desactivar" : "activar";
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a "${emp.name}"?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/empleados/${emp.id}/toggle`, { method: "PATCH" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchEmployees();
      toast.success(`El empleado "${emp.name}" ha sido ${emp.status === "Activo" ? "desactivado" : "activado"} correctamente.`);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar estado.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Attendance Handler ─── */
  const handleRegisterAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttEmpId) {
      toast.warning("Seleccione un empleado.");
      return;
    }
    const emp = employees.find(e => String(e.id) === selectedAttEmpId);
    if (!emp) return;

    let updatedLogs = [...attendanceLogs];

    if (attType === "entrada") {
      // Registrar nueva entrada
      const hasOpenClockIn = attendanceLogs.some(l => l.employeeId === emp.id && l.clockOut === null);
      if (hasOpenClockIn) {
        toast.error(`"${emp.name}" ya cuenta con un turno de entrada activo. Registre su salida primero.`);
        return;
      }

      const newLog: AttendanceLog = {
        id: Math.random().toString(36).substring(2, 9),
        employeeId: emp.id,
        employeeName: emp.name,
        date: attDate,
        clockIn: attTime,
        clockOut: null,
        totalHours: null
      };

      updatedLogs = [newLog, ...updatedLogs];
      toast.success(`Entrada registrada para ${emp.name}`);
    } else {
      // Registrar salida en la entrada abierta más reciente
      const openLogIdx = attendanceLogs.findIndex(l => l.employeeId === emp.id && l.clockOut === null);
      if (openLogIdx === -1) {
        toast.error(`"${emp.name}" no tiene una marcación de entrada activa abierta.`);
        return;
      }

      const log = { ...updatedLogs[openLogIdx] };
      log.clockOut = attTime;

      // Calcular horas totales
      try {
        const inDateTime = new Date(`${log.date}T${log.clockIn}:00`);
        const outDateTime = new Date(`${attDate}T${attTime}:00`);
        const diffMs = outDateTime.getTime() - inDateTime.getTime();
        if (diffMs < 0) {
          toast.warning("La hora de salida es anterior a la entrada de ese día.");
        }
        const hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        log.totalHours = hours > 0 ? hours : 0;
      } catch (err) {
        log.totalHours = 0;
      }

      updatedLogs[openLogIdx] = log;
      toast.success(`Salida registrada para ${emp.name} (${log.totalHours} hrs)`);
    }

    setAttendanceLogs(updatedLogs);
    localStorage.setItem("employee_attendance_logs", JSON.stringify(updatedLogs));
    
    // Refresh time for next click
    setAttTime(new Date().toTimeString().slice(0, 5));
  };

  const handleDeleteAttLog = (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta marcación de asistencia?")) return;
    const filtered = attendanceLogs.filter(l => l.id !== id);
    setAttendanceLogs(filtered);
    localStorage.setItem("employee_attendance_logs", JSON.stringify(filtered));
    toast.success("Registro de asistencia eliminado.");
  };

  const handleClearAttendance = () => {
    if (!confirm("¿Desea vaciar TODO el historial de asistencia registrado?")) return;
    setAttendanceLogs([]);
    localStorage.removeItem("employee_attendance_logs");
    toast.success("Historial de asistencia vaciado.");
  };

  /* ─── Commission Calculations ─── */
  const calculateCommissionMetrics = (emp: Employee) => {
    const cargoLow = emp.position.toLowerCase();
    const isSales = cargoLow.includes("vendedor") || cargoLow.includes("venta") || cargoLow.includes("caja");
    const isProd = cargoLow.includes("operario") || cargoLow.includes("torno") || cargoLow.includes("fundi");

    let itemsSalesCount = 0;
    let totalSalesVal = 0;
    let commission = 0;

    let ordersCompleted = 0;
    let productionIncentive = 0;

    if (isSales) {
      const employeeSales = sales.filter(s => s.sellerName && (
        s.sellerName.toLowerCase() === emp.name.toLowerCase() || 
        emp.name.toLowerCase().includes(s.sellerName.toLowerCase()) ||
        s.sellerName.toLowerCase().includes(emp.name.toLowerCase())
      ));
      itemsSalesCount = employeeSales.length;
      totalSalesVal = employeeSales.reduce((acc, s) => acc + Number(s.total), 0);
      commission = totalSalesVal * 0.10; // 10% comision de ventas
    }

    if (isProd) {
      const completed = productionOrders.filter(o => Number(o.responsableId) === emp.id && o.status === "Finalizado");
      ordersCompleted = completed.length;
      productionIncentive = ordersCompleted * 20; // 20 Bs por orden
    }

    const baseSalary = emp.salary ? Number(emp.salary) : 0;
    const totalPayout = baseSalary + commission + productionIncentive;

    return {
      isSales,
      isProd,
      itemsSalesCount,
      totalSalesVal,
      commission,
      ordersCompleted,
      productionIncentive,
      baseSalary,
      totalPayout
    };
  };

  const exportPayrollToExcel = () => {
    const mappedPayroll = employees.map(emp => {
      const metrics = calculateCommissionMetrics(emp);
      return {
        name: emp.name,
        cargo: emp.position,
        salary: formatMoney(metrics.baseSalary),
        extras: metrics.isSales 
          ? `Comisión Ventas (10%): ${formatMoney(metrics.commission)} (${metrics.itemsSalesCount} vtas)`
          : metrics.isProd 
            ? `Incentivo Torno: ${formatMoney(metrics.productionIncentive)} (${metrics.ordersCompleted} lotes)`
            : "—",
        total: formatMoney(metrics.totalPayout)
      };
    });

    exportarAExcel("Nomina_Salarios", [
      { header: "Empleado", key: "name" },
      { header: "Cargo / Función", key: "cargo" },
      { header: "Sueldo Base", key: "salary" },
      { header: "Comisiones / Incentivos", key: "extras" },
      { header: "Líquido Pagable", key: "total" }
    ], mappedPayroll);
  };

  const printPayrollGeneralPDF = () => {
    const mapped = employees.map(emp => {
      const metrics = calculateCommissionMetrics(emp);
      return {
        name: emp.name,
        cargo: emp.position,
        base: formatMoney(metrics.baseSalary),
        detalles: metrics.isSales 
          ? `Comisión: ${formatMoney(metrics.commission)} (${metrics.itemsSalesCount} vtas)` 
          : metrics.isProd 
            ? `Incentivos: ${formatMoney(metrics.productionIncentive)} (${metrics.ordersCompleted} OP)` 
            : "—",
        payout: formatMoney(metrics.totalPayout)
      };
    });

    imprimirReporteA4(
      `Planilla de Salarios y Comisiones - ${selectedMonth}`,
      ["Empleado", "Cargo / Función", "Sueldo Base", "Conceptos Variables", "Líquido Pagable"],
      ["name", "cargo", "base", "detalles", "payout"],
      mapped,
      `Calculado sobre ${employees.length} fichas con base en transacciones de la plataforma.`
    );
  };

  const printBoletaSueldo = (emp: Employee) => {
    const metrics = calculateCommissionMetrics(emp);
    
    // Utilidad de impresión local de boletas de sueldo
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const fechaFormateada = new Date().toLocaleString("es-BO", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Boleta de Pago - ${emp.name}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #0095ff;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .logo-area h1 {
            margin: 0;
            font-size: 22px;
            color: #0095ff;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .logo-area p {
            margin: 2px 0 0 0;
            color: #666;
            font-size: 9px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            margin: 0;
            font-size: 16px;
            color: #333;
          }
          .invoice-title p {
            margin: 4px 0 0 0;
            font-size: 10px;
            color: #555;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 10px;
            text-transform: uppercase;
            color: #888;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            padding-bottom: 3px;
            margin-bottom: 6px;
          }
          .details-col p {
            margin: 2px 0;
            font-size: 10px;
          }
          .details-col strong {
            color: #111;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th {
            background-color: #f4f6f8;
            color: #444;
            text-align: left;
            padding: 6px 8px;
            font-size: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #ddd;
          }
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #eee;
            font-size: 10px;
          }
          .text-right {
            text-align: right;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .totals-table {
            width: 240px;
            margin-bottom: 0;
          }
          .totals-table td {
            padding: 4px 8px;
            border-bottom: none;
          }
          .totals-table tr.grand-total td {
            border-top: 2px solid #0095ff;
            font-size: 13px;
            font-weight: bold;
            color: #0095ff;
            padding-top: 8px;
          }
          .signatures {
            margin-top: 80px;
            display: flex;
            justify-content: space-around;
          }
          .signature-line {
            text-align: center;
            width: 160px;
            border-top: 1px solid #999;
            padding-top: 4px;
            font-size: 9px;
            color: #666;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #aaa;
            border-top: 1px solid #eee;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <h1>REPUESTOS LA PAZ</h1>
            <p>Venta de Repuestos Automotrices - La Paz, Bolivia</p>
            <p>Dirección: Av. Montes Nro 425, La Paz, Bolivia</p>
            <p>Teléfono: +591 2 2445566 | Nit: 1020304050</p>
          </div>
          <div class="invoice-title">
            <h2>BOLETA DE SUELDO OFICIAL</h2>
            <p><strong>Periodo:</strong> ${selectedMonth}</p>
            <p><strong>Fecha Emisión:</strong> ${fechaFormateada}</p>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-col">
            <div class="section-title">Datos del Empleado</div>
            <p><strong>Nombre Completo:</strong> ${emp.name}</p>
            <p><strong>Cédula Identidad:</strong> ${emp.ci || "—"}</p>
            <p><strong>Cargo / Función:</strong> ${emp.position}</p>
          </div>
          <div class="details-col">
            <div class="section-title">Detalles Laborales</div>
            <p><strong>Turno Asignado:</strong> ${emp.shift || "Sin definir"}</p>
            <p><strong>Fecha Ingreso:</strong> ${formatDate(emp.hireDate)}</p>
            <p><strong>Estado ficha:</strong> ${emp.status}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Concepto / Descripción del Pago</th>
              <th class="text-right">Monto Devengado (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Salario Básico Mensual</td>
              <td class="text-right">${formatMoney(metrics.baseSalary)}</td>
            </tr>
            ${metrics.commission > 0 ? `
              <tr>
                <td>Comisión de Ventas de Repuestos (10% de ventas / ${metrics.itemsSalesCount} transacciones)</td>
                <td class="text-right">${formatMoney(metrics.commission)}</td>
              </tr>
            ` : ''}
            ${metrics.productionIncentive > 0 ? `
              <tr>
                <td>Incentivo de Planta (Bs. 20 por orden de producción finalizada / ${metrics.ordersCompleted} OP)</td>
                <td class="text-right">${formatMoney(metrics.productionIncentive)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="totals-section">
          <table class="totals-table">
            <tr class="grand-total">
              <td>LÍQUIDO NETO A COBRAR:</td>
              <td class="text-right"><strong>${formatMoney(metrics.totalPayout)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="signatures">
          <div class="signature-line">
            Firma Empleador<br>
            <strong>Repuestos La Paz</strong>
          </div>
          <div class="signature-line">
            Firma Empleado<br>
            <strong>${emp.name}</strong>
          </div>
        </div>

        <div class="footer">
          Este recibo de pago certifica el abono de la nómina por parte de la empresa al empleado titular.
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 350);
  };

  /* ─── Form Fields Component ─── */
  const FormFields: React.FC<{
    name: string; setName: (v: string) => void; ci: string; setCi: (v: string) => void;
    email: string; setEmail: (v: string) => void; phone: string; setPhone: (v: string) => void;
    address: string; setAddress: (v: string) => void; position: string; setPosition: (v: string) => void;
    shift: string; setShift: (v: string) => void; salary: string; setSalary: (v: string) => void;
    birth: string; setBirth: (v: string) => void; hire: string; setHire: (v: string) => void;
    emergency: string; setEmergency: (v: string) => void; notes: string; setNotes: (v: string) => void;
  }> = (p) => (
    <>
      <div className="space-y-1 mb-1">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Datos Personales</p>
        <div className="h-px bg-primary/20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre Completo *</Label>
          <input type="text" value={p.name} onChange={e => p.setName(e.target.value)} placeholder="ej: Andrés Gómez" className={InputClass} required />
        </div>
        <div>
          <Label>Cédula de Identidad</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input type="text" value={p.ci} onChange={e => p.setCi(e.target.value)} placeholder="ej: 12345678" className={InputClass + " pl-9"} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input type="email" value={p.email} onChange={e => p.setEmail(e.target.value)} placeholder="correo@email.com" className={InputClass + " pl-9"} />
          </div>
        </div>
        <div>
          <Label>Teléfono *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input type="text" value={p.phone} onChange={e => p.setPhone(e.target.value)} placeholder="ej: 71234567" className={InputClass + " pl-9"} required />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Fecha de Nacimiento</Label>
          <input type="date" value={p.birth} onChange={e => p.setBirth(e.target.value)} className={InputClass} />
        </div>
        <div>
          <Label>Dirección</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input type="text" value={p.address} onChange={e => p.setAddress(e.target.value)} placeholder="Dirección de domicilio" className={InputClass + " pl-9"} />
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-1 mt-2">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Datos Laborales</p>
        <div className="h-px bg-primary/20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Cargo / Función *</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input type="text" value={p.position} onChange={e => p.setPosition(e.target.value)} placeholder="ej: Operador de Torno" className={InputClass + " pl-9"} required />
          </div>
        </div>
        <div>
          <Label>Turno</Label>
          <select value={p.shift} onChange={e => p.setShift(e.target.value)} className={SelectClass}>
            <option value="" className="bg-card">— Sin definir —</option>
            <option value="Mañana" className="bg-card">Mañana</option>
            <option value="Tarde" className="bg-card">Tarde</option>
            <option value="Completo" className="bg-card">Completo</option>
            <option value="Nocturno" className="bg-card">Nocturno</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Salario Mensual (Bs.)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input type="number" step="0.01" min="0" value={p.salary} onChange={e => p.setSalary(e.target.value)} placeholder="0.00" className={InputClass + " pl-9"} />
          </div>
        </div>
        <div>
          <Label>Fecha de Contratación</Label>
          <input type="date" value={p.hire} onChange={e => p.setHire(e.target.value)} className={InputClass} />
        </div>
      </div>

      <div className="space-y-1 mb-1 mt-2">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Adicional</p>
        <div className="h-px bg-primary/20" />
      </div>
      <div>
        <Label>Contacto de Emergencia</Label>
        <div className="relative">
          <Contact className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input type="text" value={p.emergency} onChange={e => p.setEmergency(e.target.value)} placeholder="Nombre y teléfono" className={InputClass + " pl-9"} />
        </div>
      </div>
      <div>
        <Label>Notas / Observaciones</Label>
        <textarea value={p.notes} onChange={e => p.setNotes(e.target.value)} placeholder="Observaciones internas..." rows={2} className={InputClass + " resize-none"} />
      </div>
    </>
  );

  /* ─── Render principal ─── */
  return (
    <div className="p-6 space-y-6">
      {/* Cabecera y Tab Button Selector */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-border pb-5 md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Personal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administración de expedientes, control de turnos de asistencia y cálculo de nómina comercial.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button 
              onClick={() => setActiveSubTab("fichas")} 
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                activeSubTab === "fichas" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Fichas de Personal
            </button>
            <button 
              onClick={() => setActiveSubTab("asistencia")} 
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                activeSubTab === "asistencia" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Asistencia & Turnos
            </button>
            <button 
              onClick={() => setActiveSubTab("comisiones")} 
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                activeSubTab === "comisiones" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Comisiones & Nómina
            </button>
          </div>
          {activeSubTab === "fichas" && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg uppercase tracking-wider transition-all active:scale-[0.98] shadow-[0_2px_10px_rgba(0,149,255,0.25)]"
            >
              <Plus className="h-4 w-4" /> Registrar Personal
            </button>
          )}
        </div>
      </div>

      {error && activeSubTab === "fichas" && !showCreateModal && !showEditModal && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ────────────────── TABS RENDERING ────────────────── */}

      {activeSubTab === "fichas" ? (
        /* VISTA 1: FICHAS DE PERSONAL (CRUD ACTUAL) */
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Expedientes de Empleados
              <span className="text-muted-foreground text-sm font-normal ml-2">({employees.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pr-3">Nombre</th>
                  <th className="pb-3 pr-3">CI</th>
                  <th className="pb-3 pr-3">Cargo</th>
                  <th className="pb-3 pr-3">Turno</th>
                  <th className="pb-3 pr-3">Contacto</th>
                  <th className="pb-3 pr-3">Contratación</th>
                  <th className="pb-3 pr-3">Estado</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando personal...
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground uppercase tracking-widest">
                      No hay empleados registrados.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className={`hover:bg-muted/10 transition-all font-medium ${emp.status === "Inactivo" ? "opacity-50" : ""}`}>
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-primary text-sm">{emp.name}</div>
                        {emp.email && <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-2.5 w-2.5" />{emp.email}</div>}
                      </td>
                      <td className="py-3.5 pr-3 text-muted-foreground">{emp.ci || "—"}</td>
                      <td className="py-3.5 pr-3 text-foreground">{emp.position}</td>
                      <td className="py-3.5 pr-3">
                        {emp.shift ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <Clock className="h-2.5 w-2.5" />{emp.shift}
                          </span>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="py-3.5 pr-3 text-muted-foreground">
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-primary/40" />{emp.phone}</div>
                      </td>
                      <td className="py-3.5 pr-3 text-muted-foreground">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary/40" />{formatDate(emp.hireDate)}</div>
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          emp.status === "Activo" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          <Power className="h-3 w-3" />{emp.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(emp)} disabled={actionLoading}
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleToggle(emp)} disabled={actionLoading}
                            className={`p-1.5 rounded transition-all ${emp.status === "Activo" ? "hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400" : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400"}`}
                            title={emp.status === "Activo" ? "Desactivar" : "Activar"}>
                            <Power className="h-4 w-4" />
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
      ) : activeSubTab === "asistencia" ? (
        /* VISTA 2: CONTROL DE ASISTENCIA */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Marcación */}
          <div className="rounded-xl border border-border bg-card p-6 h-fit space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-2 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Registrar Marcación Reloj
            </h3>
            
            <form onSubmit={handleRegisterAttendance} className="space-y-4">
              <div>
                <Label>Empleado</Label>
                <select 
                  value={selectedAttEmpId} 
                  onChange={(e) => setSelectedAttEmpId(e.target.value)} 
                  className={SelectClass}
                >
                  {employees.filter(e => e.status === "Activo").map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-card">
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                  {employees.filter(e => e.status === "Activo").length === 0 && (
                    <option value="">No hay personal activo</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha</Label>
                  <input 
                    type="date" 
                    value={attDate} 
                    onChange={(e) => setAttDate(e.target.value)} 
                    className={InputClass} 
                    required 
                  />
                </div>
                <div>
                  <Label>Hora marcación</Label>
                  <input 
                    type="time" 
                    value={attTime} 
                    onChange={(e) => setAttTime(e.target.value)} 
                    className={InputClass} 
                    required 
                  />
                </div>
              </div>

              <div>
                <Label>Tipo Registro</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button 
                    type="button" 
                    onClick={() => setAttType("entrada")}
                    className={`py-2 text-xs font-bold uppercase rounded border transition-all ${
                      attType === "entrada" 
                        ? "bg-green-600/10 border-green-500/30 text-green-400 font-black" 
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Reloj Entrada
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAttType("salida")}
                    className={`py-2 text-xs font-bold uppercase rounded border transition-all ${
                      attType === "salida" 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-black" 
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Reloj Salida
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] shadow-md shadow-primary/20"
              >
                <Check className="h-4 w-4" /> Registrar Marcación
              </button>
            </form>
          </div>

          {/* Listado de Marcaciones */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground uppercase tracking-wider">
                  Historial del Turno
                </h3>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select 
                  value={filterAttEmpId} 
                  onChange={(e) => setFilterAttEmpId(e.target.value)} 
                  className="rounded border border-border bg-muted/50 px-2 py-1 text-xs text-foreground font-bold"
                >
                  <option value="Todos">Todos los empleados</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {attendanceLogs.length > 0 && (
                  <button 
                    onClick={handleClearAttendance}
                    className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                    title="Vaciar historial"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">Empleado</th>
                    <th className="pb-2">Entrada</th>
                    <th className="pb-2">Salida</th>
                    <th className="pb-2 text-right">Horas Acum.</th>
                    <th className="pb-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceLogs
                    .filter(log => filterAttEmpId === "Todos" ? true : String(log.employeeId) === filterAttEmpId)
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-muted/10 font-medium">
                        <td className="py-2.5 font-mono">{log.date}</td>
                        <td className="py-2.5 text-foreground">{log.employeeName}</td>
                        <td className="py-2.5"><span className="text-green-400 font-bold">{log.clockIn}</span></td>
                        <td className="py-2.5">
                          {log.clockOut ? (
                            <span className="text-amber-400 font-bold">{log.clockOut}</span>
                          ) : (
                            <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Activo</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-bold text-foreground">
                          {log.totalHours !== null ? `${log.totalHours} hrs` : "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          <button 
                            onClick={() => handleDeleteAttLog(log.id)}
                            className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {attendanceLogs.filter(log => filterAttEmpId === "Todos" ? true : String(log.employeeId) === filterAttEmpId).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground uppercase tracking-widest font-mono text-[10px]">
                        Sin marcaciones en el historial.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 3: COMISIONES Y NOMINA */
        <div className="space-y-6 animate-fadeIn">
          {/* Resumen General Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Periodo Calculado</span>
              <span className="text-lg font-black text-primary mt-1 block">{selectedMonth}</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Salarios Base</span>
              <span className="text-lg font-black text-foreground mt-1 block">
                {formatMoney(employees.reduce((acc, e) => acc + (e.salary ? Number(e.salary) : 0), 0))}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Comisiones Variables (Vtas/Prod)</span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">
                {formatMoney(employees.reduce((acc, e) => {
                  const m = calculateCommissionMetrics(e);
                  return acc + m.commission + m.productionIncentive;
                }, 0))}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Nómina Devengada</span>
              <span className="text-lg font-black text-cyan-400 mt-1 block">
                {formatMoney(employees.reduce((acc, e) => acc + calculateCommissionMetrics(e).totalPayout, 0))}
              </span>
            </div>
          </div>

          {/* Tabla de Planilla */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-3 mb-4 gap-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground uppercase tracking-wider">
                  Planilla de Sueldos y Liquidación
                </h3>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={exportPayrollToExcel}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  title="Exportar nómina a Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={printPayrollGeneralPDF}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
                  title="Imprimir planilla de nómina A4"
                >
                  <Printer className="h-4 w-4" />
                  Planilla A4
                </button>
              </div>
            </div>

            {commissionLoading ? (
              <div className="text-center text-xs text-muted-foreground py-10 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Procesando planilla comercial...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3">Nombre</th>
                      <th className="pb-3">Cargo / Función</th>
                      <th className="pb-3 text-right">Sueldo Base</th>
                      <th className="pb-3 text-right">Ventas / Lotes</th>
                      <th className="pb-3 text-right">Comisiones (10%)</th>
                      <th className="pb-3 text-right">Incentivos Planta</th>
                      <th className="pb-3 text-right">Líquido Pagable</th>
                      <th className="pb-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employees.map((emp) => {
                      const metrics = calculateCommissionMetrics(emp);
                      return (
                        <tr key={emp.id} className="hover:bg-muted/10 font-medium">
                          <td className="py-3 font-bold text-foreground">{emp.name}</td>
                          <td className="py-3 text-muted-foreground">{emp.position}</td>
                          <td className="py-3 text-right font-mono">{formatMoney(metrics.baseSalary)}</td>
                          <td className="py-3 text-right">
                            {metrics.isSales 
                              ? `${metrics.itemsSalesCount} vtas (${formatMoney(metrics.totalSalesVal)})` 
                              : metrics.isProd 
                                ? `${metrics.ordersCompleted} lotes` 
                                : "—"
                            }
                          </td>
                          <td className="py-3 text-right text-emerald-400 font-mono">
                            {metrics.isSales ? formatMoney(metrics.commission) : "—"}
                          </td>
                          <td className="py-3 text-right text-indigo-400 font-mono">
                            {metrics.isProd ? formatMoney(metrics.productionIncentive) : "—"}
                          </td>
                          <td className="py-3 text-right font-black text-cyan-400 font-mono">{formatMoney(metrics.totalPayout)}</td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => printBoletaSueldo(emp)}
                              className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded text-[9px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Imprimir boleta de sueldo A4"
                            >
                              <Printer className="h-3 w-3" /> Boleta
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-muted-foreground uppercase tracking-widest">
                          No hay personal registrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ MODAL CREAR ═══════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-zoomIn">
            <div className="flex items-center gap-2 mb-5 border-b border-border pb-3 justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold uppercase tracking-wider text-foreground">Registrar Empleado</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}
              <FormFields name={fName} setName={setFName} ci={fCi} setCi={setFCi} email={fEmail} setEmail={setFEmail}
                phone={fPhone} setPhone={setFPhone} address={fAddress} setAddress={setFAddress} position={fPosition} setPosition={setFPosition}
                shift={fShift} setShift={setFShift} salary={fSalary} setSalary={setFSalary} birth={fBirth} setBirth={setFBirth}
                hire={fHire} setHire={setFHire} emergency={fEmergency} setEmergency={setFEmergency} notes={fNotes} setNotes={setFNotes} />
              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-border rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(0,149,255,0.2)]">
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Registrar Personal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ MODAL EDITAR ═══════ */}
      {showEditModal && editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-zoomIn">
            <div className="flex items-center gap-2 mb-5 border-b border-border pb-3 justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold uppercase tracking-wider text-foreground">
                  Editar: <span className="text-primary">{editingEmp.name}</span>
                </h3>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingEmp(null); }} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}
              <FormFields name={eName} setName={setEName} ci={eCi} setCi={setECi} email={eEmail} setEmail={setEEmail}
                phone={ePhone} setPhone={setEPhone} address={eAddress} setAddress={setEAddress} position={ePosition} setPosition={setEPosition}
                shift={eShift} setShift={setEShift} salary={eSalary} setSalary={setESalary} birth={eBirth} setBirth={setEBirth}
                hire={eHire} setHire={setEHire} emergency={eEmergency} setEmergency={setEEmergency} notes={eNotes} setNotes={setENotes} />

              <div className="bg-muted/30 rounded-lg p-3 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className={`font-bold ${editingEmp.status === "Activo" ? "text-emerald-400" : "text-red-400"}`}>{editingEmp.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registrado:</span>
                  <span className="text-foreground font-medium">{formatDate(editingEmp.createdAt)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingEmp(null); }}
                  className="px-4 py-2.5 border border-border rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(0,149,255,0.2)]">
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
