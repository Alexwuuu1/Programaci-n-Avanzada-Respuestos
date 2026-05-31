import React, { useState } from "react";
import type { Venta } from "../types";
import { History, FileSpreadsheet, Eye, X, Calendar, User } from "lucide-react";

interface SaleHistoryProps {
  sales: Venta[];
}

export const SaleHistory: React.FC<SaleHistoryProps> = ({ sales }) => {
  const [selectedSale, setSelectedSale] = useState<Venta | null>(null);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center gap-2 bg-card border border-border p-4 rounded-xl">
        <History className="h-5 w-5 text-primary" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Historial de Facturación ({sales.length})
        </span>
      </div>

      {/* Grid or Table */}
      {sales.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground text-sm rounded-xl">
          No hay ventas registradas en el historial.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Folio Venta</th>
                  <th className="p-4">Cliente / Taller</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Vendedor</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="p-4 font-mono font-bold text-primary">#VT-{s.id}</td>
                    <td className="p-4 font-semibold text-foreground">{s.clientName}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-muted-foreground capitalize">{s.sellerName}</td>
                    <td className="p-4 text-right font-bold text-foreground">Bs. {s.total}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="p-1.5 rounded bg-muted border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95"
                        title="Ver detalle"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalle Venta */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <FileSpreadsheet className="h-5 w-5" /> Detalle de Venta #VT-{selectedSale.id}
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 text-muted-foreground hover:bg-muted rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info header sale */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-background/50 p-3 rounded-lg border border-border">
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Cliente</span>
                <span className="font-bold text-foreground">{selectedSale.clientName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Fecha / Hora</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" /> {new Date(selectedSale.date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Vendedor</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5 capitalize">
                  <User className="h-3.5 w-3.5 text-primary" /> {selectedSale.sellerName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-primary">Bs. {selectedSale.total}</span>
              </div>
            </div>

            {/* Product items detail */}
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-background/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/10 text-[9px] font-bold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="p-2">Repuesto</th>
                    <th className="p-2 text-right">Cant</th>
                    <th className="p-2 text-right">Precio</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[11px]">
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <span className="text-[9px] text-muted-foreground font-mono">[{item.productOem}]</span>
                        <p className="font-semibold text-foreground">{item.productName}</p>
                      </td>
                      <td className="p-2 text-right font-bold">{item.quantity}</td>
                      <td className="p-2 text-right">Bs. {item.priceUnit}</td>
                      <td className="p-2 text-right font-bold text-foreground">Bs. {item.subtotal || item.quantity * item.priceUnit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setSelectedSale(null)}
              className="w-full bg-primary text-primary-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
