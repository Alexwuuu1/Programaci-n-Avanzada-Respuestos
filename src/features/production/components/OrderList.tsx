import React from "react";
import type { ProductionOrder } from "../types";
import { Layers, Play, CheckCircle2, XCircle, Calendar, Plus, User } from "lucide-react";

interface OrderListProps {
  orders: ProductionOrder[];
  onStatusChange: (
    id: string,
    status: "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado"
  ) => void;
  onAddClick: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onStatusChange,
  onAddClick,
}) => {
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
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Órdenes en Planta ({orders.length})
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Nueva Orden
        </button>
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
                    Cantidad
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
                      onClick={() => onStatusChange(o.id, "Finalizado")}
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
    </div>
  );
};
