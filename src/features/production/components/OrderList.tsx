import React, { useState } from "react";
import type { ProductionOrder } from "../types";
import { Layers, Play, CheckCircle2, XCircle, Calendar, Plus, User, Flag, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "../../../components/ui/Toast";
import { exportarAExcel } from "../../../utils/exportUtils";
import { imprimirReporteA4 } from "../../finances/utils/printUtils";
import { formatMoney } from "../../../lib/formatters";

interface OrderListProps {
  orders: ProductionOrder[];
  onStatusChange: (
    id: string,
    status: "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado",
    cantidadProducida?: number
  ) => void;
  onAddClick: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onStatusChange,
  onAddClick,
}) => {
  const [finishingOrder, setFinishingOrder] = useState<ProductionOrder | null>(null);
  const [actualQuantity, setActualQuantity] = useState<string>("");

  const handleExportExcel = () => {
    const mapped = orders.map(o => ({
      ...o,
      formattedStart: new Date(o.startDate).toLocaleString("es-BO"),
      formattedEnd: o.endDate ? new Date(o.endDate).toLocaleString("es-BO") : "N/A",
      formattedCosto: o.costoProduccion != null ? formatMoney(o.costoProduccion) : "N/A"
    }));

    exportarAExcel("Ordenes_Produccion", [
      { header: "ID Orden", key: "id", transform: (val) => `#OP-${val}` },
      { header: "Repuesto (OEM)", key: "productOem" },
      { header: "Repuesto (Nombre)", key: "productName" },
      { header: "Cantidad Planeada", key: "quantity" },
      { header: "Cantidad Producida", key: "cantidadProducida", transform: (val) => val != null ? val : "N/A" },
      { header: "Costo Producción (Bs.)", key: "formattedCosto" },
      { header: "Prioridad", key: "prioridad" },
      { header: "Responsable", key: "responsibleName" },
      { header: "Fecha Inicio", key: "formattedStart" },
      { header: "Fecha Fin", key: "formattedEnd" },
      { header: "Estado", key: "status" }
    ], mapped);
  };

  const handlePrintPDF = () => {
    const dataToPrint = orders.map(o => ({
      id: `#OP-${o.id}`,
      producto: `[${o.productOem}] ${o.productName}`,
      planeada: `${o.quantity} pzas`,
      producida: o.cantidadProducida != null ? `${o.cantidadProducida} pzas` : "N/A",
      costo: o.costoProduccion != null ? formatMoney(o.costoProduccion) : "N/A",
      estado: o.status
    }));

    imprimirReporteA4(
      "Reporte de Control de Órdenes de Producción",
      ["ID Orden", "Repuesto / Lote", "Cant. Planeada", "Cant. Producida", "Costo Lote", "Estado"],
      ["id", "producto", "planeada", "producida", "costo", "estado"],
      dataToPrint,
      `Total: ${orders.length} órdenes en planta.`
    );
  };

  const getStatusBadge = (status: ProductionOrder["status"]) => {
    switch (status) {
      case "Pendiente":
        return "bg-muted border-border text-muted-foreground";
      case "En Proceso":
        return "bg-primary/10 border-primary text-primary animate-pulse";
      case "Finalizado":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      case "Cancelado":
        return "bg-red-500/10 border-red-500/30 text-red-400";
    }
  };

  const getBorderColor = (status: ProductionOrder["status"]) => {
    switch (status) {
      case "En Proceso":
        return "border-primary/50 shadow-[0_0_15px_rgba(255,69,0,0.05)]";
      case "Finalizado":
        return "border-green-500/20";
      default:
        return "border-border";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Órdenes en Planta ({orders.length})
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Exportar órdenes de producción a Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Imprimir órdenes de producción en PDF A4"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={onAddClick}
            className="flex items-center justify-center gap-1 bg-primary text-primary-foreground px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Nueva Orden
          </button>
        </div>
      </div>

      {/* Grid of Production Cards */}
      {orders.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground text-sm rounded-xl">
          No hay órdenes de fabricación registradas en el sistema.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <div
              key={o.id}
              className={`rounded-xl border bg-card p-5 space-y-4 transition-all ${getBorderColor(
                o.status
              )}`}
            >
              {/* Row 1: OEM & Status */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                    OEM: {o.productOem}
                  </span>
                  <h4 className="text-sm font-bold text-foreground mt-2">{o.productName}</h4>
                </div>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                    o.status
                  )}`}
                >
                  {o.status}
                </span>
              </div>

              {/* Row 2: Quantity & Operators */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-background/50 p-3 rounded-lg border border-border/50">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                    Cantidad Planeada
                  </span>
                  <span className="font-bold text-foreground text-sm">{o.quantity} pzas</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                    Responsable
                  </span>
                  <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <User className="h-3.5 w-3.5 text-primary" /> {o.responsibleName}
                  </span>
                </div>
                {o.status === "Finalizado" && (
                  <div className="col-span-2 grid grid-cols-2 gap-3 border-t border-border/30 pt-2 mt-1">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                        Cantidad Producida
                      </span>
                      <span className="font-bold text-green-400 text-sm">
                        {o.cantidadProducida ?? o.quantity} pzas
                      </span>
                    </div>
                    {o.cantidadProducida !== undefined && o.cantidadProducida !== o.quantity && (
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                          {o.cantidadProducida < o.quantity ? "Merma (Descarte)" : "Excedente"}
                        </span>
                        <span className={`font-bold text-sm ${
                          o.cantidadProducida < o.quantity ? "text-red-400" : "text-blue-400"
                        }`}>
                          {Math.abs(o.quantity - o.cantidadProducida)} pzas
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-background/30 p-3 rounded-lg border border-border/50">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                    Prioridad
                  </span>
                  <span className={`font-bold flex items-center gap-1 mt-0.5 ${
                    o.prioridad === "Urgente" ? "text-red-400" : o.prioridad === "Alta" ? "text-yellow-400" : "text-foreground"
                  }`}>
                    <Flag className="h-3.5 w-3.5" /> {o.prioridad}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                    Costo
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {o.costoProduccion != null ? formatMoney(o.costoProduccion) : "N/A"}
                  </span>
                </div>
                {o.observaciones && (
                  <div className="col-span-2 text-muted-foreground">
                    <span className="block text-[9px] uppercase tracking-wider">Observaciones</span>
                    <span className="text-foreground">{o.observaciones}</span>
                  </div>
                )}
              </div>

              {/* Row 3: Timestamps */}
              <div className="flex flex-col gap-1 text-[10px] text-muted-foreground border-t border-border/50 pt-3">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Inicio: {new Date(o.startDate).toLocaleDateString()}{" "}
                  {new Date(o.startDate).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {o.endDate && (
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Fin: {new Date(o.endDate).toLocaleDateString()}{" "}
                    {new Date(o.endDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              {/* Row 4: Status Actions */}
              {o.status !== "Finalizado" && o.status !== "Cancelado" && (
                <div className="flex gap-2 border-t border-border/50 pt-3">
                  {o.status === "Pendiente" && (
                    <button
                      onClick={() => onStatusChange(o.id, "En Proceso")}
                      className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground py-2 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-accent transition-all"
                    >
                      <Play className="h-3 w-3" /> Iniciar Torno
                    </button>
                  )}
                  {o.status === "En Proceso" && (
                    <button
                      onClick={() => {
                        setFinishingOrder(o);
                        setActualQuantity(String(o.quantity));
                      }}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Terminar Lote
                    </button>
                  )}
                  <button
                    onClick={() => onStatusChange(o.id, "Cancelado")}
                    className="flex items-center justify-center gap-1 border border-border hover:bg-red-500/10 hover:text-red-400 text-muted-foreground px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    <XCircle className="h-3 w-3" /> Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal for entering physical quantity upon completion */}
      {finishingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-primary/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,180,255,0.15)] transition-all">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" /> Finalizar Lote de Producción
              </h3>
              <button
                onClick={() => setFinishingOrder(null)}
                className="text-muted-foreground hover:text-foreground text-lg transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-background/50 border border-border p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Repuesto:</span>
                  <span className="font-bold text-foreground">{finishingOrder.productName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">OEM:</span>
                  <span className="font-mono text-foreground font-semibold">{finishingOrder.productOem}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cantidad Planificada:</span>
                  <span className="font-bold text-foreground">{finishingOrder.quantity} pzas</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Cantidad Real Producida
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded px-3 py-2 text-sm text-foreground outline-none transition-all font-semibold"
                  placeholder={`Ej. ${finishingOrder.quantity}`}
                />
                {Number(actualQuantity) < finishingOrder.quantity && Number(actualQuantity) >= 0 && (
                  <p className="text-[10px] text-red-400 font-semibold">
                    ⚠️ Se registrará una merma de {finishingOrder.quantity - Number(actualQuantity)} piezas.
                  </p>
                )}
                {Number(actualQuantity) > finishingOrder.quantity && (
                  <p className="text-[10px] text-blue-400 font-semibold">
                    ℹ️ Se registrará un excedente de {Number(actualQuantity) - finishingOrder.quantity} piezas.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-muted/40 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setFinishingOrder(null)}
                className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground rounded text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const qty = Number(actualQuantity);
                  if (isNaN(qty) || qty < 0) {
                    toast.error("Por favor ingrese una cantidad producida válida (0 o más).");
                    return;
                  }
                  onStatusChange(finishingOrder.id, "Finalizado", qty);
                  setFinishingOrder(null);
                }}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-all"
              >
                Confirmar y Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
