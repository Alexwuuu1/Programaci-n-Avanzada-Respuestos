import React, { useState, useEffect } from "react";
import type { InventoryMovement } from "./types";
import { getInventoryMovements } from "./api";
import { Search, ArrowUpRight, ArrowDownLeft, AlertCircle, FileSpreadsheet, Printer } from "lucide-react";
import { exportarAExcel } from "../../utils/exportUtils";
import { imprimirReporteA4 } from "../finances/utils/printUtils";
import { formatNumber } from "../../lib/formatters";

export const InventoryFeature: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Todos" | "Entrada" | "Salida">("Todos");

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError("");
      const [mRecords, kpiData] = await Promise.all([
        getInventoryMovements(),
        fetch("/api/dashboard/kpis").then((r) => {
          if (!r.ok) return { topProducts: [] };
          return r.json();
        }).catch(() => ({ topProducts: [] }))
      ]);
      setMovements(mRecords);
      setTopProducts(kpiData.topProducts || []);
    } catch (e: any) {
      setError(e.message || "Error al obtener el historial del Kardex.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const filtered = movements.filter((m) => {
    const matchesSearch = m.productOem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "Todos" ? true : m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportExcel = () => {
    const mappedData = filtered.map(m => ({
      ...m,
      formattedQty: `${m.type === "Entrada" ? "+" : "-"}${m.quantity}`,
      formattedDate: new Date(m.date).toLocaleString("es-BO")
    }));
    exportarAExcel("Kardex_Inventario", [
      { header: "Tipo Movimiento", key: "type" },
      { header: "OEM", key: "productOem" },
      { header: "Repuesto", key: "productName" },
      { header: "Cantidad", key: "formattedQty" },
      { header: "Motivo / Operación", key: "reason" },
      { header: "Fecha", key: "formattedDate" },
      { header: "Responsable", key: "responsibleName" }
    ], mappedData);
  };

  const handlePrintPDF = () => {
    const dataToPrint = filtered.map(m => ({
      tipo: m.type,
      oem: m.productOem,
      producto: m.productName,
      cantidad: `${m.type === "Entrada" ? "+" : "-"}${m.quantity}`,
      motivo: m.reason,
      fecha: new Date(m.date).toLocaleDateString("es-BO"),
      responsable: m.responsibleName
    }));

    imprimirReporteA4(
      "Reporte de Kardex e Historial de Stock",
      ["Tipo", "OEM", "Repuesto / Producto", "Cantidad", "Motivo / Operación", "Fecha", "Responsable"],
      ["tipo", "oem", "producto", "cantidad", "motivo", "fecha", "responsable"],
      dataToPrint,
      `Búsqueda: "${searchTerm || 'Todas'}" | Tipo: "${typeFilter}"`
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold text-foreground">Kardex e Historial de Stock</h1>
        <p className="text-sm text-muted-foreground mt-1">Auditoría de almacén, trazabilidad de entradas de producción y salidas por facturación.</p>
      </div>

      {/* Top Rotación bar */}
      {!loading && topProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topProducts.slice(0, 3).map((p, idx) => (
            <div key={p.id} className="bg-card border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(0,180,255,0.02)]">
              <div className="space-y-1 min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-primary flex items-center gap-1">
                  🔥 Top {idx + 1} Más Vendido
                </span>
                <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                <p className="text-[9px] text-muted-foreground font-mono">OEM: {p.oem}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-green-400 block">{formatNumber(p.quantitySold)} pzas</span>
                <span className="text-[9px] text-muted-foreground">Vendido</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 bg-card border border-border p-4 rounded-xl items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por OEM o repuesto..."
            className="w-full rounded bg-input border border-border pr-3 pl-9 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            {(["Todos", "Entrada", "Salida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                  typeFilter === t ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Exportar Kardex a Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Imprimir Kardex en PDF A4"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-xs text-muted-foreground py-12">Cargando auditoría de movimientos...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Tipo</th>
                  <th className="p-4">OEM / Repuesto</th>
                  <th className="p-4 text-right">Cant</th>
                  <th className="p-4">Motivo / Operación</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/10">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        m.type === "Entrada" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}>
                        {m.type === "Entrada" ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {m.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] text-muted-foreground font-mono">[{m.productOem}]</span>
                      <p className="font-semibold text-foreground">{m.productName}</p>
                    </td>
                    <td className={`p-4 text-right font-bold text-sm ${m.type === "Entrada" ? "text-green-400" : "text-red-400"}`}>
                      {m.type === "Entrada" ? "+" : "-"}{formatNumber(m.quantity)}
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">{m.reason}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-muted-foreground capitalize">{m.responsibleName}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground text-xs">
                      {movements.length === 0
                        ? "Aun no hay movimientos registrados. Procesa una venta, recibe una compra o finaliza una orden para alimentar el Kardex."
                        : "No se encontraron movimientos coincidentes en el Kardex."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
