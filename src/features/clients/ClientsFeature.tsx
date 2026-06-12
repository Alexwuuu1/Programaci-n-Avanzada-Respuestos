import React, { useEffect, useState } from "react";
import type { CRMCliente } from "./types";
import { toast } from "../../components/ui/Toast";
import { createClienteCRM, deleteClienteCRM, getClientesCRM, updateClienteCRM, getClienteEstadoCuenta, registrarAbono } from "./api";
import {
  Calendar,
  Check,
  ChevronRight,
  DollarSign,
  Edit3,
  Info,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Printer,
  FileSpreadsheet,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { imprimirReciboA4, imprimirReporteA4 } from "../finances/utils/printUtils";
import { exportarAExcel } from "../../utils/exportUtils";
import { formatMoney } from "../../lib/formatters";

type FidelidadFilter = "Todos" | "Premium" | "Frecuente" | "Nuevo";
type TipoFilter = "Todos" | "Particular" | "Taller" | "Empresa";
type EstadoFilter = "Todos" | "Activo" | "Inactivo";
type DeudaFilter = "Todos" | "Con deuda" | "Sin deuda";
type ClientFormStep = "basico" | "contacto" | "comercial" | "extra";

const clientFormSteps: Array<{ id: ClientFormStep; label: string; hint: string }> = [
  { id: "basico", label: "Basico", hint: "Nombre y tipo" },
  { id: "contacto", label: "Contacto", hint: "Telefono y datos" },
  { id: "comercial", label: "Comercial", hint: "Credito y descuento" },
  { id: "extra", label: "Extra", hint: "Vehiculos y notas" },
];

const InputClass = "w-full rounded border border-border bg-muted/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold";

export const ClientsFeature: React.FC = () => {
  const [clients, setClients] = useState<CRMCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fidelidadFilter, setFidelidadFilter] = useState<FidelidadFilter>("Todos");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("Todos");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("Todos");
  const [deudaFilter, setDeudaFilter] = useState<DeudaFilter>("Todos");
  const [selectedClient, setSelectedClient] = useState<CRMCliente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<CRMCliente | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [subTab, setSubTab] = useState<"crm" | "credit">("crm");
  const [activeStatement, setActiveStatement] = useState<any | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedVentaForAbono, setSelectedVentaForAbono] = useState<any | null>(null);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [abonoMetodo, setAbonoMetodo] = useState("Efectivo");
  const [abonoComprobante, setAbonoComprobante] = useState("");
  const [abonoNotas, setAbonoNotas] = useState("");

  const handleLoadStatement = async (clienteId: string) => {
    try {
      setActionLoading(true);
      const data = await getClienteEstadoCuenta(clienteId);
      setActiveStatement(data);
      setShowStatementModal(true);
    } catch (e: any) {
      toast.error(e.message || "Error al obtener estado de cuenta.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVentaForAbono || !abonoMonto || Number(abonoMonto) <= 0) {
      toast.warning("Introduce un monto válido.");
      return;
    }

    try {
      setActionLoading(true);
      await registrarAbono({
        ventaId: selectedVentaForAbono.id,
        monto: Number(abonoMonto),
        metodoPago: abonoMetodo,
        comprobante: abonoComprobante.trim() || undefined,
        notas: abonoNotas.trim() || undefined,
      });

      await loadClients();
      const updatedStmt = await getClienteEstadoCuenta(activeStatement.clienteId);
      setActiveStatement(updatedStmt);
      
      setShowAbonoModal(false);
      setSelectedVentaForAbono(null);
      setAbonoMonto("");
      setAbonoComprobante("");
      setAbonoNotas("");
      toast.success("Abono registrado con éxito.");
    } catch (err: any) {
      toast.error(err.message || "Error al registrar el abono.");
    } finally {
      setActionLoading(false);
    }
  };

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientNit, setClientNit] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTipo, setClientTipo] = useState("Particular");
  const [clientVehiculos, setClientVehiculos] = useState("");
  const [clientFidelidad, setClientFidelidad] = useState("Nuevo");
  const [clientDiscount, setClientDiscount] = useState("");
  const [clientCredit, setClientCredit] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [clientStatus, setClientStatus] = useState("Activo");
  const [clientFormStepIndex, setClientFormStepIndex] = useState(0);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");
      setClients(await getClientesCRM());
    } catch (e: any) {
      setError(e.message || "Error al cargar los clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleExportExcel = () => {
    exportarAExcel("Directorio_Clientes", [
      { header: "Cliente / Nombre", key: "name" },
      { header: "NIT / CI", key: "nit", transform: (val) => val || "" },
      { header: "Teléfono", key: "phone", transform: (val) => val || "" },
      { header: "Email", key: "email", transform: (val) => val || "" },
      { header: "Tipo Cliente", key: "tipo", transform: (val) => val || "Particular" },
      { header: "Fidelidad", key: "nivelFidelidad", transform: (val) => val === "VIP" ? "Premium" : (val || "Nuevo") },
      { header: "Total Compras (Bs.)", key: "totalSpent", transform: (val) => formatMoney(Number(val)) },
      { header: "Cant. Compras", key: "salesCount" },
      { header: "Límite Crédito (Bs.)", key: "limiteCredito", transform: (val) => val != null ? formatMoney(Number(val)) : formatMoney(0) },
      { header: "Saldo Deudor (Bs.)", key: "saldoDeudor", transform: (val) => val != null ? formatMoney(Number(val)) : formatMoney(0) },
      { header: "Estado", key: "estado" }
    ], filteredClients);
  };

  const handlePrintPDF = () => {
    const dataToPrint = filteredClients.map(c => ({
      name: c.name,
      nit: c.nit || "Particular",
      phone: c.phone || "S/T",
      tipo: c.tipo || "Particular",
      fidelidad: getFidelidadLabel(c),
      totalSpent: formatMoney(c.totalSpent),
      saldoDeudor: formatMoney(c.saldoDeudor || 0)
    }));
    
    const filterText = `Búsqueda: "${search || 'Ninguna'}" | Fidelización: "${fidelidadFilter}"`;

    imprimirReporteA4(
      "Reporte de Clientes y Cuentas",
      ["Nombre / Razón", "NIT / CI", "Teléfono", "Tipo", "Fidelidad", "Total Compras", "Saldo Deudor"],
      ["name", "nit", "phone", "tipo", "fidelidad", "totalSpent", "saldoDeudor"],
      dataToPrint,
      filterText
    );
  };

  const getCreditClients = () => clients.filter(c => (c.saldoDeudor && Number(c.saldoDeudor) > 0) || (c.limiteCredito && Number(c.limiteCredito) > 0));

  const handleExportCreditExcel = () => {
    exportarAExcel("Cuentas_Cobrar_Clientes", [
      { header: "Cliente", key: "name" },
      { header: "Tipo", key: "tipo" },
      { header: "Límite Crédito (Bs.)", key: "limiteCredito", transform: (val) => val != null ? formatMoney(Number(val)) : "Sin Límite" },
      { header: "Saldo Deudor (Bs.)", key: "saldoDeudor", transform: (val) => formatMoney(Number(val || 0)) },
      { header: "Estado", key: "estado" }
    ], getCreditClients());
  };

  const handlePrintCreditPDF = () => {
    const creditList = getCreditClients();
    const dataToPrint = creditList.map(c => ({
      name: c.name,
      tipo: c.tipo || "Particular",
      limiteCredito: c.limiteCredito != null ? formatMoney(c.limiteCredito) : "Sin Límite",
      saldoDeudor: formatMoney(c.saldoDeudor || 0),
      estado: c.estado
    }));

    imprimirReporteA4(
      "Reporte de Cuentas por Cobrar (Saldos Deudores)",
      ["Cliente / Nombre", "Tipo", "Límite Autorizado", "Saldo Deudor", "Estado"],
      ["name", "tipo", "limiteCredito", "saldoDeudor", "estado"],
      dataToPrint,
      "Filtro: Todos los clientes con saldo deudor o límite de crédito activo."
    );
  };

  const getFidelidadLabel = (c: CRMCliente): "Premium" | "Frecuente" | "Nuevo" => {
    if (c.nivelFidelidad === "VIP") return "Premium";
    if (c.nivelFidelidad === "Frecuente") return "Frecuente";
    if (c.nivelFidelidad === "Nuevo") return "Nuevo";
    if (c.totalSpent >= 2000 || c.salesCount >= 3) return "Premium";
    if (c.totalSpent >= 500 || c.salesCount >= 2) return "Frecuente";
    return "Nuevo";
  };

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    const saldo = Number(c.saldoDeudor || 0);
    const tipo = c.tipo || "Particular";
    const estado = c.estado || "Activo";
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.nit || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.vehiculos || "").toLowerCase().includes(q);
    const matchesFidelidad = fidelidadFilter === "Todos" || getFidelidadLabel(c) === fidelidadFilter;
    const matchesTipo = tipoFilter === "Todos" || tipo === tipoFilter;
    const matchesEstado = estadoFilter === "Todos" || estado === estadoFilter;
    const matchesDeuda = deudaFilter === "Todos" || (deudaFilter === "Con deuda" ? saldo > 0 : saldo <= 0);
    return matchesSearch && matchesFidelidad && matchesTipo && matchesEstado && matchesDeuda;
  });

  const totalClients = clients.length;
  const totalRevenue = clients.reduce((acc, c) => acc + c.totalSpent, 0);
  const premiumCount = clients.filter((c) => getFidelidadLabel(c) === "Premium").length;
  const totalDebt = clients.reduce((acc, c) => acc + Number(c.saldoDeudor || 0), 0);
  const debtClients = clients.filter((c) => Number(c.saldoDeudor || 0) > 0).length;

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setClientAddress("");
    setClientNit("");
    setClientEmail("");
    setClientTipo("Particular");
    setClientVehiculos("");
    setClientFidelidad("Nuevo");
    setClientDiscount("");
    setClientCredit("");
    setClientNotes("");
    setClientStatus("Activo");
  };

  const openNewModal = () => {
    setEditingClient(null);
    resetForm();
    setClientFormStepIndex(0);
    setShowModal(true);
  };

  const openEditModal = (c: CRMCliente, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(c);
    setClientName(c.name);
    setClientPhone(c.phone);
    setClientAddress(c.address);
    setClientNit(c.nit || "");
    setClientEmail(c.email || "");
    setClientTipo(c.tipo || "Particular");
    setClientVehiculos(c.vehiculos || "");
    setClientFidelidad(c.nivelFidelidad || "Nuevo");
    setClientDiscount(c.descuentoPorcentaje?.toString() || "");
    setClientCredit(c.limiteCredito?.toString() || "");
    setClientNotes(c.notas || "");
    setClientStatus(c.estado || "Activo");
    setClientFormStepIndex(0);
    setShowModal(true);
  };

  const validateClientStep = (stepId = clientFormSteps[clientFormStepIndex].id) => {
    if (stepId === "basico") {
      if (!clientName.trim()) {
        toast.warning("El nombre o razon social es obligatorio.");
        return false;
      }
      return true;
    }

    if (stepId === "contacto") {
      if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
        toast.warning("El email no tiene un formato valido.");
        return false;
      }
      if (clientPhone.trim() && clientPhone.trim().replace(/[^\d]/g, "").length < 6) {
        toast.warning("El telefono parece demasiado corto.");
        return false;
      }
      return true;
    }

    if (stepId === "comercial") {
      const discount = clientDiscount ? Number(clientDiscount) : 0;
      const credit = clientCredit ? Number(clientCredit) : 0;
      if (Number.isNaN(discount) || discount < 0 || discount > 100) {
        toast.warning("El descuento debe estar entre 0 y 100%.");
        return false;
      }
      if (Number.isNaN(credit) || credit < 0) {
        toast.warning("El limite de credito no puede ser negativo.");
        return false;
      }
      return true;
    }

    return true;
  };

  const goNextClientStep = () => {
    if (!validateClientStep()) return;
    setClientFormStepIndex((current) => Math.min(clientFormSteps.length - 1, current + 1));
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (clientFormStepIndex < clientFormSteps.length - 1) {
      goNextClientStep();
      return;
    }

    for (const step of clientFormSteps) {
      if (!validateClientStep(step.id)) {
        setClientFormStepIndex(clientFormSteps.findIndex((item) => item.id === step.id));
        return;
      }
    }

    const payload = {
      name: clientName.trim(),
      phone: clientPhone.trim() || undefined,
      address: clientAddress.trim() || undefined,
      nit: clientNit.trim() || null,
      email: clientEmail.trim() || null,
      tipo: clientTipo,
      vehiculos: clientVehiculos.trim() || null,
      nivelFidelidad: clientFidelidad,
      descuentoPorcentaje: clientDiscount ? Number(clientDiscount) : null,
      limiteCredito: clientCredit ? Number(clientCredit) : null,
      notas: clientNotes.trim() || null,
      estado: clientStatus,
    };

    try {
      setActionLoading(true);
      if (editingClient) {
        const updated = await updateClienteCRM(editingClient.id, payload);
        setClients(clients.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        if (selectedClient?.id === updated.id) setSelectedClient({ ...selectedClient, ...updated });
        toast.success("¡Cliente actualizado!");
      } else {
        const created = await createClienteCRM(payload);
        setClients([created, ...clients]);
        toast.success("¡Cliente registrado!");
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message || "Error al guardar el cliente.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Está seguro de eliminar este cliente?")) return;
    try {
      setActionLoading(true);
      await deleteClienteCRM(id);
      setClients(clients.filter((c) => c.id !== id));
      if (selectedClient?.id === id) setSelectedClient(null);
      toast.success("¡Cliente eliminado!");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar el cliente.");
    } finally {
      setActionLoading(false);
    }
  };

  const resetClientFilters = () => {
    setSearch("");
    setFidelidadFilter("Todos");
    setTipoFilter("Todos");
    setEstadoFilter("Todos");
    setDeudaFilter("Todos");
  };

  return (
    <div className="p-6 space-y-6 relative min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-5 sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes y Cuentas</h1>
          <p className="text-sm text-muted-foreground mt-1">Clientes, historial comercial, credito y cobranzas.</p>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-center">
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button onClick={() => setSubTab("crm")} className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${subTab === "crm" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}>Clientes</button>
            <button onClick={() => setSubTab("credit")} className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${subTab === "credit" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}>Cuentas por Cobrar</button>
          </div>
          <button onClick={openNewModal} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg uppercase tracking-wider transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Registrar Cliente
          </button>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2"><Info className="h-4 w-4" /> {error}</div>}

      {subTab === "crm" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Kpi icon={<Users className="h-5 w-5" />} label="Cartera Total" value={`${totalClients} Clientes`} />
            <Kpi icon={<DollarSign className="h-5 w-5" />} label="Facturado Historico" value={formatMoney(totalRevenue)} />
            <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Deuda por Cobrar" value={`${formatMoney(totalDebt)} (${debtClients})`} />
            <Kpi icon={<UserCheck className="h-5 w-5" />} label="Clientes Premium" value={`${premiumCount} Premium`} />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-input pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold" placeholder="Buscar por nombre, NIT, email, telefono, direccion o vehiculo..." />
              </div>
              <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value as TipoFilter)} className={InputClass}>
                <option value="Todos">Todos los tipos</option>
                <option value="Particular">Particular</option>
                <option value="Taller">Taller</option>
                <option value="Empresa">Empresa</option>
              </select>
              <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)} className={InputClass}>
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>
              <select value={deudaFilter} onChange={(e) => setDeudaFilter(e.target.value as DeudaFilter)} className={InputClass}>
                <option value="Todos">Todos los saldos</option>
                <option value="Con deuda">Con deuda</option>
                <option value="Sin deuda">Sin deuda</option>
              </select>
              <button onClick={resetClientFilters} className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all">Limpiar</button>
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap bg-muted p-1 rounded-lg border border-border">
                {(["Todos", "Premium", "Frecuente", "Nuevo"] as const).map((filter) => (
                  <button key={filter} onClick={() => setFidelidadFilter(filter)} className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${fidelidadFilter === filter ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}>
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  title="Exportar directorio a Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
                  title="Imprimir directorio en PDF A4"
                >
                  <Printer className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs uppercase tracking-wider">Cargando directorio...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {filteredClients.map((c) => {
                const label = getFidelidadLabel(c);
                const saldo = Number(c.saldoDeudor || 0);
                const hasDebt = saldo > 0;
                return (
                  <div key={c.id} onClick={() => setSelectedClient(c)} className={`rounded-lg border bg-card p-5 cursor-pointer relative group flex flex-col justify-between min-h-60 transition-all duration-200 hover:border-primary/40 ${selectedClient?.id === c.id ? "border-primary bg-primary/5" : "border-border"} ${c.estado === "Inactivo" ? "opacity-60" : ""}`}>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      {hasDebt && <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Debe</span>}
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${label === "Premium" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : label === "Frecuente" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-muted text-muted-foreground border border-border"}`}>{label}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-all pr-16 truncate uppercase tracking-wide">{c.name}</h4>
                      <div className="space-y-1.5 mt-3 text-xs text-muted-foreground font-medium">
                        <p>{c.tipo || "Particular"} {c.nit ? `- NIT/CI ${c.nit}` : ""}</p>
                        <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-primary/70" /> {c.phone || "Sin telefono"}</p>
                        <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 text-primary/70" /> {c.address || "Direccion no registrada"}</p>
                        {c.vehiculos && <p className="truncate">Vehiculos: {c.vehiculos}</p>}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <MiniStat label="Compras" value={String(c.salesCount)} />
                        <MiniStat label="Acum." value={formatMoney(c.totalSpent)} />
                        <MiniStat label="Debe" value={formatMoney(saldo)} danger={hasDebt} />
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-2 border-t border-border/50 pt-3 mt-3">
                      <button onClick={(e) => { e.stopPropagation(); handleLoadStatement(c.id); }} disabled={actionLoading} className="rounded bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-all">
                        Cuenta
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedClient(c); }} disabled={actionLoading} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all" title="Ver ficha"><ChevronRight className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => openEditModal(c, e)} disabled={actionLoading} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all" title="Editar"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => handleDeleteClient(c.id, e)} disabled={actionLoading} className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-all" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* VISTA DE CUENTAS POR COBRAR */
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Clientes con Línea de Crédito Activa
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportCreditExcel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  title="Exportar cuentas por cobrar a Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={handlePrintCreditPDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
                  title="Imprimir cuentas por cobrar en PDF A4"
                >
                  <Printer className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 uppercase tracking-wider font-semibold text-muted-foreground">
                    <th className="p-4">Cliente</th>
                    <th className="p-4 text-right">Límite de Crédito</th>
                    <th className="p-4 text-right">Deuda Actual</th>
                    <th className="p-4">% Uso</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.filter(c => (c.saldoDeudor && Number(c.saldoDeudor) > 0) || (c.limiteCredito && Number(c.limiteCredito) > 0)).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground uppercase tracking-widest">Sin deudas ni líneas de crédito registradas</td>
                    </tr>
                  ) : (
                    clients
                      .filter(c => (c.saldoDeudor && Number(c.saldoDeudor) > 0) || (c.limiteCredito && Number(c.limiteCredito) > 0))
                      .map((c) => {
                        const deudor = Number(c.saldoDeudor || 0);
                        const limite = Number(c.limiteCredito || 0);
                        const pct = limite > 0 ? (deudor / limite) * 100 : 0;
                        return (
                          <tr key={c.id} className="hover:bg-muted/10 font-medium text-foreground">
                            <td className="p-4">
                              <div className="text-sm font-bold text-primary">{c.name}</div>
                              <div className="text-[10px] text-muted-foreground">{c.tipo} {c.nit ? `- NIT: ${c.nit}` : ""}</div>
                            </td>
                            <td className="p-4 text-right font-mono font-semibold">{limite > 0 ? formatMoney(limite) : "Sin Límite"}</td>
                            <td className="p-4 text-right font-mono font-bold">
                              <span className={deudor > 0 ? "text-yellow-500" : "text-muted-foreground"}>{formatMoney(deudor)}</span>
                            </td>
                            <td className="p-4">
                              {limite > 0 ? (
                                <div className="space-y-1 w-28">
                                  <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                                    <div className={`h-full rounded ${pct > 90 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-primary"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                  </div>
                                  <span className="text-[9px] text-muted-foreground font-mono">{Math.round(pct)}% utilizado</span>
                                </div>
                              ) : <span className="text-muted-foreground/50 font-mono">—</span>}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${c.estado === "Inactivo" ? "bg-muted border-border text-muted-foreground" : "bg-green-500/10 border-green-500/20 text-green-400"}`}>{c.estado}</span>
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleLoadStatement(c.id)} className="px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/25 text-primary text-[10px] font-bold rounded uppercase tracking-wider transition-all">
                                Ver Estado / Cobrar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PANEL LATERAL CRM DETALLES */}
      {selectedClient && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-card border-l border-border shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-foreground uppercase tracking-wider">Ficha del Cliente</h3>
                <span className="text-xs text-muted-foreground">Datos, compras y estado comercial</span>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"><X className="h-5 w-5" /></button>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3 mb-6">
              <h4 className="text-base font-extrabold text-primary uppercase">{selectedClient.name}</h4>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Compras" value={String(selectedClient.salesCount)} />
                <MiniStat label="Acum." value={formatMoney(selectedClient.totalSpent)} />
                <MiniStat label="Debe" value={formatMoney(selectedClient.saldoDeudor || 0)} danger={Number(selectedClient.saldoDeudor || 0) > 0} />
              </div>
              <div className="text-xs space-y-1.5 font-semibold text-muted-foreground">
                <p><strong className="text-foreground">NIT/CI:</strong> {selectedClient.nit || "No registrado"}</p>
                <p><strong className="text-foreground">Email:</strong> {selectedClient.email || "No registrado"}</p>
                <p><strong className="text-foreground">Tipo:</strong> {selectedClient.tipo || "Particular"}</p>
                <p><strong className="text-foreground">Vehiculos:</strong> {selectedClient.vehiculos || "No registrado"}</p>
                <p><strong className="text-foreground">Descuento:</strong> {selectedClient.descuentoPorcentaje ?? 0}%</p>
                <p><strong className="text-foreground">Credito:</strong> {formatMoney(selectedClient.limiteCredito ?? 0)}</p>
                <p><strong className="text-foreground">Total Gastado:</strong> {formatMoney(selectedClient.totalSpent)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button onClick={() => handleLoadStatement(selectedClient.id)} className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-all">Estado Cuenta</button>
              <button onClick={(e) => openEditModal(selectedClient, e)} className="rounded-lg bg-muted border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/80 transition-all">Editar</button>
            </div>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto">
              {!selectedClient.purchaseHistory || selectedClient.purchaseHistory.length === 0 ? (
                <div className="rounded-lg border border-border/50 p-6 text-center text-muted-foreground text-xs uppercase tracking-wider bg-muted/10">Sin historial de compras registrado.</div>
              ) : selectedClient.purchaseHistory.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-muted/15 p-3 flex justify-between items-center hover:bg-muted/30 transition-all">
                  <div>
                    <p className="text-xs font-bold text-foreground">Factura #{p.id}</p>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="h-3 w-3" /> {new Date(p.date).toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs font-extrabold text-foreground">{formatMoney(p.total)}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setSelectedClient(null)} className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg uppercase tracking-wider transition-all border border-border">Cerrar Vista</button>
        </div>
      )}

      {/* MODAL ESTADO DE CUENTA (CUENTAS POR COBRAR) */}
      {showStatementModal && activeStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-2xl animate-zoomIn flex flex-col">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground uppercase tracking-wider">Estado de Cuenta y Cobranzas</h3>
                <span className="text-xs text-primary font-bold">{activeStatement.nombreCliente}</span>
              </div>
              <button onClick={() => setShowStatementModal(false)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded bg-muted/20 border border-border/50 p-4">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Deuda Total Consolidada</span>
                <span className="text-xl font-mono font-black text-yellow-500 mt-1 block">{formatMoney(activeStatement.deudaConsolidada)}</span>
              </div>
              <div className="rounded bg-muted/20 border border-border/50 p-4">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Línea de Crédito Autorizada</span>
                <span className="text-xl font-mono font-black text-foreground mt-1 block">
                  {activeStatement.limiteCredito != null ? formatMoney(activeStatement.limiteCredito) : "Sin Límite"}
                </span>
              </div>
              <div className="rounded bg-muted/20 border border-border/50 p-4">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Crédito Disponible</span>
                <span className={`text-xl font-mono font-black mt-1 block ${
                  activeStatement.limiteCredito != null && (activeStatement.limiteCredito - activeStatement.deudaConsolidada) < 0 ? "text-red-400" : "text-emerald-400"
                }`}>
                  {activeStatement.limiteCredito != null 
                    ? formatMoney(activeStatement.limiteCredito - activeStatement.deudaConsolidada)
                    : "Ilimitado"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 overflow-hidden">
              {/* Facturas Pendientes */}
              <div className="rounded-lg border border-border bg-background/25 p-4 space-y-3 flex flex-col max-h-[45vh] overflow-y-auto">
                <h4 className="text-xs font-bold text-foreground uppercase border-b border-border/50 pb-2">Facturas a Crédito</h4>
                <div className="space-y-2">
                  {activeStatement.facturas.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-10 font-mono">Sin facturas a crédito registradas.</div>
                  ) : (
                    activeStatement.facturas.map((f: any) => (
                      <div key={f.id} className={`rounded border p-3 flex justify-between items-center transition-all ${
                        f.estaPagada ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" : "border-border bg-card"
                      }`}>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-foreground">Factura #{f.id} {f.nroFactura ? `(Ref: ${f.nroFactura})` : ""}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{new Date(f.fecha).toLocaleDateString()}</div>
                          <div className="text-[10px] text-muted-foreground">Monto: {formatMoney(f.total)}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-xs font-bold font-mono text-foreground block">Pendiente: {formatMoney(f.saldoPendiente)}</span>
                          {!f.estaPagada ? (
                            <button onClick={() => {
                              setSelectedVentaForAbono(f);
                              setAbonoMonto(f.saldoPendiente.toString());
                              setShowAbonoModal(true);
                            }} className="px-2.5 py-1 bg-primary hover:bg-primary/95 text-white text-[9px] font-bold rounded uppercase tracking-wider transition-all">
                              Cobrar Abono
                            </button>
                          ) : (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25 font-bold uppercase">Cancelada</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Historial de Abonos */}
              <div className="rounded-lg border border-border bg-background/25 p-4 space-y-3 flex flex-col max-h-[45vh] overflow-y-auto">
                <h4 className="text-xs font-bold text-foreground uppercase border-b border-border/50 pb-2">Historial de Cobros / Abonos</h4>
                <div className="space-y-2">
                  {activeStatement.abonos.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-10 font-mono">No se han registrado cobros.</div>
                  ) : (
                    activeStatement.abonos.map((a: any) => (
                      <div key={a.id} className="rounded border border-border bg-card p-3 space-y-1 hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-400">+{formatMoney(a.monto)}</span>
                          <span className="text-[9px] font-mono text-muted-foreground">{new Date(a.fecha).toLocaleDateString()} {new Date(a.fecha).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Abonado a: <strong className="text-foreground">Factura #{a.ventaId}</strong></div>
                        <div className="text-[10px] text-muted-foreground flex justify-between">
                          <span>Método: {a.metodoPago}</span>
                          {a.comprobante && <span>Ref: {a.comprobante}</span>}
                        </div>
                        {a.notes && <div className="text-[9px] text-muted-foreground italic border-t border-border/30 pt-1 pb-1 mt-1">Obs: {a.notes}</div>}
                        <div className="flex justify-between items-center border-t border-border/30 pt-2 mt-2">
                          <span className="text-[9px] text-muted-foreground">REC-{String(a.id).padStart(5, '0')}</span>
                          <button
                            type="button"
                            onClick={() => imprimirReciboA4({
                              id: a.id,
                              ventaId: a.ventaId,
                              monto: a.monto,
                              fecha: a.fecha,
                              metodoPago: a.metodoPago,
                              comprobante: a.comprobante,
                              notas: a.notes,
                              clienteNombre: activeStatement.nombreCliente,
                              clienteId: activeStatement.clienteId
                            })}
                            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" /> Imprimir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-6 flex justify-end">
              <button onClick={() => setShowStatementModal(false)} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded uppercase tracking-wider transition-all border border-border">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO */}
      {showAbonoModal && selectedVentaForAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-2xl animate-zoomIn">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground mb-4 border-b border-border pb-2">
              Cobrar Abono a Factura #{selectedVentaForAbono.id}
            </h3>
            <form onSubmit={handleSaveAbono} className="space-y-4">
              <div className="rounded bg-muted/20 border border-border/50 p-3 text-xs flex justify-between">
                <span className="text-muted-foreground">Saldo Pendiente de Factura:</span>
                <strong className="text-foreground font-mono">{formatMoney(selectedVentaForAbono.saldoPendiente)}</strong>
              </div>

              <Field label="Monto a Cobrar (Bs.)">
                <input type="number" min={0.01} max={selectedVentaForAbono.saldoPendiente + 0.01} step="0.01" value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} className={InputClass} required />
              </Field>

              <Field label="Método de Pago del Cobro">
                <select value={abonoMetodo} onChange={(e) => setAbonoMetodo(e.target.value)} className={InputClass}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="QR">Cobro QR</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                </select>
              </Field>

              <Field label="Nro. Comprobante / Referencia (Opcional)">
                <input type="text" value={abonoComprobante} onChange={(e) => setAbonoComprobante(e.target.value)} className={InputClass} placeholder="Nro de transferencia o depósito" />
              </Field>

              <Field label="Observaciones / Glosa (Opcional)">
                <textarea value={abonoNotas} onChange={(e) => setAbonoNotas(e.target.value)} rows={2} className={InputClass} placeholder="Comentario sobre el cobro" />
              </Field>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-5">
                <button type="button" onClick={() => { setShowAbonoModal(false); setSelectedVentaForAbono(null); }} className="px-3.5 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all">Cancelar</button>
                <button type="submit" disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-all">
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRAR O EDITAR CLIENTE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-2xl animate-zoomIn">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-foreground">{editingClient ? "Editar Cliente" : "Registrar Cliente"}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Completa los datos por fases. Solo lo basico es obligatorio.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded border border-border p-1.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 grid gap-2 sm:grid-cols-4">
              {clientFormSteps.map((step, index) => {
                const active = index === clientFormStepIndex;
                const done = index < clientFormStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (index <= clientFormStepIndex || validateClientStep()) setClientFormStepIndex(index);
                    }}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      active ? "border-primary bg-primary/10" : done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-background/30"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Fase {index + 1}</span>
                    <p className="mt-1 text-sm font-black text-foreground">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.hint}</p>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveClient} className="space-y-5">
              {clientFormStepIndex === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre / Razon Social *"><input value={clientName} onChange={(e) => setClientName(e.target.value)} className={InputClass} placeholder="Ej. Taller San Cristobal" required autoFocus /></Field>
                  <Field label="Tipo de cliente"><select value={clientTipo} onChange={(e) => setClientTipo(e.target.value)} className={InputClass}><option value="Particular">Particular</option><option value="Taller">Taller</option><option value="Empresa">Empresa</option></select></Field>
                  <Field label="Estado"><select value={clientStatus} onChange={(e) => setClientStatus(e.target.value)} className={InputClass}><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></Field>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                    <strong className="block text-foreground">Tip operativo</strong>
                    Si es taller o empresa, agrega NIT/CI y datos de contacto en la siguiente fase para facturar mas rapido.
                  </div>
                </div>
              )}

              {clientFormStepIndex === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="NIT / CI"><input value={clientNit} onChange={(e) => setClientNit(e.target.value)} className={InputClass} placeholder="Documento para factura" /></Field>
                  <Field label="Telefono"><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={InputClass} placeholder="Celular o WhatsApp" /></Field>
                  <Field label="Email"><input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={InputClass} placeholder="correo@cliente.com" /></Field>
                  <Field label="Direccion"><textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={3} className={InputClass} placeholder="Zona, calle, referencia" /></Field>
                </div>
              )}

              {clientFormStepIndex === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Fidelidad"><select value={clientFidelidad} onChange={(e) => setClientFidelidad(e.target.value)} className={InputClass}><option value="Nuevo">Nuevo</option><option value="Frecuente">Frecuente</option><option value="VIP">VIP</option></select></Field>
                  <Field label="Descuento %"><input type="number" min={0} max={100} step="0.01" value={clientDiscount} onChange={(e) => setClientDiscount(e.target.value)} className={InputClass} placeholder="0.00" /></Field>
                  <Field label="Limite Credito Bs."><input type="number" min={0} step="0.01" value={clientCredit} onChange={(e) => setClientCredit(e.target.value)} className={InputClass} placeholder="0.00" /></Field>
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-xs text-yellow-100">
                    <strong className="block text-yellow-300">Control comercial</strong>
                    El credito se usa para cuentas por cobrar. Dejalo en blanco si el cliente solo compra al contado.
                  </div>
                </div>
              )}

              {clientFormStepIndex === 3 && (
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Vehiculos"><textarea value={clientVehiculos} onChange={(e) => setClientVehiculos(e.target.value)} rows={3} className={InputClass} placeholder="Ej. Toyota Hilux 2018, Corolla 2014..." /></Field>
                  <Field label="Notas internas"><textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} rows={3} className={InputClass} placeholder="Preferencias, acuerdos, referencias o comentarios comerciales" /></Field>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MiniStat label="Tipo" value={clientTipo} />
                    <MiniStat label="Estado" value={clientStatus} />
                    <MiniStat label="Descuento" value={`${clientDiscount || 0}%`} />
                    <MiniStat label="Credito" value={clientCredit ? formatMoney(Number(clientCredit)) : formatMoney(0)} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all">Cancelar</button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setClientFormStepIndex(Math.max(0, clientFormStepIndex - 1))} disabled={clientFormStepIndex === 0} className="px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-40">Atras</button>
                  {clientFormStepIndex < clientFormSteps.length - 1 ? (
                    <button type="button" onClick={goNextClientStep} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-bold uppercase tracking-wider transition-all">Siguiente</button>
                  ) : (
                    <button type="submit" disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-bold uppercase tracking-wider transition-all">
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
    <div>
      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
      <h3 className="text-2xl font-extrabold text-foreground mt-1">{value}</h3>
    </div>
    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">{icon}</div>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string; danger?: boolean }> = ({ label, value, danger = false }) => (
  <div className={`rounded border p-2 ${danger ? "border-yellow-500/25 bg-yellow-500/10" : "border-border bg-background/35"}`}>
    <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    <strong className={`mt-0.5 block truncate text-[11px] font-black ${danger ? "text-yellow-400" : "text-foreground"}`}>{value}</strong>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</label>
    {children}
  </div>
);
