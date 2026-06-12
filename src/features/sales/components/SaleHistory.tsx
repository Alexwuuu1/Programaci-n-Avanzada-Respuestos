import React, { useMemo, useState } from "react";
import type { Venta } from "../types";
import { History, FileSpreadsheet, Eye, X, Calendar, User, Printer, Search, Filter, RotateCcw } from "lucide-react";
import { imprimirFacturaA4, imprimirReporteA4 } from "../../finances/utils/printUtils";
import { exportarAExcel } from "../../../utils/exportUtils";
import { formatMoney, formatNumber } from "../../../lib/formatters";

interface SaleHistoryProps {
  sales: Venta[];
}

export const SaleHistory: React.FC<SaleHistoryProps> = ({ sales }) => {
  const [selectedSale, setSelectedSale] = useState<Venta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"Todos" | Venta["metodoPago"]>("Todos");
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Completada" | "Anulada">("Todos");
  const [clientFilter, setClientFilter] = useState("Todos");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const clientOptions = useMemo(() => {
    return Array.from(new Set(sales.map((sale) => sale.clientName).filter(Boolean))).sort();
  }, [sales]);

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const end = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date).getTime();
      const status = sale.estado || "Completada";
      const matchesText =
        !q ||
        [
          sale.id,
          `VT-${String(sale.id).padStart(6, "0")}`,
          sale.clientName,
          sale.sellerName,
          sale.metodoPago,
          status,
          sale.nroFactura,
          sale.observaciones,
          ...sale.items.flatMap((item) => [item.productName, item.productOem]),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      return (
        matchesText &&
        (paymentFilter === "Todos" || sale.metodoPago === paymentFilter) &&
        (statusFilter === "Todos" || status === statusFilter) &&
        (clientFilter === "Todos" || sale.clientName === clientFilter) &&
        (start === null || saleDate >= start) &&
        (end === null || saleDate <= end)
      );
    });
  }, [clientFilter, fromDate, paymentFilter, sales, searchQuery, statusFilter, toDate]);

  const resetFilters = () => {
    setSearchQuery("");
    setPaymentFilter("Todos");
    setStatusFilter("Todos");
    setClientFilter("Todos");
    setFromDate("");
    setToDate("");
  };

  const handleExportExcel = () => {
    exportarAExcel("Historial_Ventas", [
      { header: "Folio Venta", key: "id", transform: (val) => `VT-${String(val).padStart(6, '0')}` },
      { header: "Cliente", key: "clientName" },
      { header: "Fecha", key: "date", transform: (val) => new Date(val).toLocaleString("es-BO") },
      { header: "Método de Pago", key: "metodoPago" },
      { header: "Estado", key: "estado", transform: (val) => val || "Completada" },
      { header: "Descuento (Bs.)", key: "descuento", transform: (val) => val != null ? formatMoney(Number(val)) : formatMoney(0) },
      { header: "Total Venta (Bs.)", key: "total", transform: (val) => formatMoney(Number(val)) }
    ], filteredSales);
  };

  const handlePrintPDF = () => {
    const dataToPrint = filteredSales.map(s => ({
      folio: `VT-${String(s.id).padStart(6, '0')}`,
      client: s.clientName,
      fecha: new Date(s.date).toLocaleDateString("es-BO"),
      metodo: s.metodoPago,
      estado: s.estado || "Completada",
      total: formatMoney(s.total)
    }));

    imprimirReporteA4(
      "Reporte de Historial de Ventas y Facturación",
      ["Folio", "Cliente", "Fecha", "Método Pago", "Estado", "Total"],
      ["folio", "client", "fecha", "metodo", "estado", "total"],
      dataToPrint,
      `Filtrado con ${filteredSales.length} transacciones de ${sales.length} ventas registradas.`
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Historial de Facturación ({filteredSales.length}/{sales.length})
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Exportar facturación a Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Imprimir facturación en PDF A4"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          Filtros de facturas
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar factura, cliente, vendedor, OEM o repuesto..."
              className="h-10 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-xs font-semibold text-foreground outline-none transition-all focus:border-primary"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value as typeof paymentFilter)}
            className="h-10 rounded-lg border border-border bg-input px-3 text-xs font-bold text-foreground outline-none transition-all focus:border-primary"
          >
            <option value="Todos">Todos los pagos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="QR">QR</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Credito">Credito</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="h-10 rounded-lg border border-border bg-input px-3 text-xs font-bold text-foreground outline-none transition-all focus:border-primary"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Completada">Completadas</option>
            <option value="Anulada">Anuladas</option>
          </select>

          <select
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            className="h-10 rounded-lg border border-border bg-input px-3 text-xs font-bold text-foreground outline-none transition-all focus:border-primary"
          >
            <option value="Todos">Todos los clientes</option>
            {clientOptions.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-10 rounded-lg border border-border bg-input px-3 text-xs font-bold text-foreground outline-none transition-all focus:border-primary"
            title="Desde"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-10 rounded-lg border border-border bg-input px-3 text-xs font-bold text-foreground outline-none transition-all focus:border-primary"
            title="Hasta"
          />

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background/40 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:text-foreground"
            title="Limpiar filtros"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Grid or Table */}
      {sales.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground text-sm rounded-xl">
          No hay ventas registradas en el historial.
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground text-sm rounded-xl">
          No hay facturas que coincidan con los filtros aplicados.
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
                  <th className="p-4">Pago / Estado</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="p-4 font-mono font-bold text-primary">#VT-{s.id}</td>
                    <td className="p-4 font-semibold text-foreground">{s.clientName}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{s.metodoPago}</div>
                      <div className="text-[10px] text-muted-foreground">{s.estado || "Completada"}</div>
                    </td>
                    <td className="p-4 text-right font-bold text-foreground">{formatMoney(s.total)}</td>
                    <td className="p-4 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="p-1.5 rounded bg-muted border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95 cursor-pointer"
                        title="Ver detalle"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => imprimirFacturaA4(s)}
                        className="p-1.5 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95 cursor-pointer"
                        title="Imprimir Factura A4"
                      >
                        <Printer className="h-4.5 w-4.5" />
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
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Metodo Pago</span>
                <span className="font-semibold text-foreground">{selectedSale.metodoPago}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Factura</span>
                <span className="font-semibold text-foreground">{selectedSale.nroFactura || "Sin numero"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-primary">{formatMoney(selectedSale.total)}</span>
              </div>
              {selectedSale.descuento != null && selectedSale.descuento > 0 && (
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Descuento</span>
                  <span className="font-semibold text-yellow-400">{formatMoney(selectedSale.descuento)}</span>
                </div>
              )}
              {selectedSale.observaciones && (
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Observaciones</span>
                  <span className="font-semibold text-foreground">{selectedSale.observaciones}</span>
                </div>
              )}
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
                      <td className="p-2 text-right font-bold">{formatNumber(item.quantity)}</td>
                      <td className="p-2 text-right">{formatMoney(item.priceUnit)}</td>
                      <td className="p-2 text-right font-bold text-foreground">{formatMoney(item.subtotal || item.quantity * item.priceUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedSale(null)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 rounded text-xs font-bold uppercase tracking-wider transition-all border border-border"
              >
                Cerrar Detalle
              </button>
              <button
                onClick={() => imprimirFacturaA4(selectedSale)}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Imprimir A4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
