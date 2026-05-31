import React, { useState, useEffect } from "react";
import type { InventoryMovement } from "./types";
import { getInventoryMovements } from "./api";
import { Search, ArrowUpRight, ArrowDownLeft, AlertCircle } from "lucide-react";

export const InventoryFeature: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Todos" | "Entrada" | "Salida">("Todos");

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getInventoryMovements();
      setMovements(data);
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

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold text-foreground">Kardex e Historial de Stock</h1>
        <p className="text-sm text-muted-foreground mt-1">Auditoría de almacén, trazabilidad de entradas de producción y salidas por facturación.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 bg-card border border-border p-4 rounded-xl items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por OEM o repuesto..."
            className="w-full rounded bg-input border border-border pr-3 pl-9 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {(["Todos", "Entrada", "Salida"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded text-xs font-semibold uppercase border transition-all ${
                typeFilter === t ? "bg-primary border-primary text-primary-foreground font-bold" : "border-border bg-input text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
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
                      {m.type === "Entrada" ? "+" : "-"}{m.quantity}
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
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">No se encontraron movimientos coincidentes en el Kardex.</td>
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
