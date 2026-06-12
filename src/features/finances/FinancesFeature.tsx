import React, { useState, useEffect } from "react";
import { Coins, TrendingUp, TrendingDown, Wallet, Printer, Calendar, Search } from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { imprimirFacturaA4, imprimirReciboA4 } from "./utils/printUtils";
import { formatMoney, formatNumber } from "../../lib/formatters";

interface FlowDay {
  label: string;
  inflows: number;
  outflows: number;
}

interface FinanceSummary {
  totalInflows: number;
  totalOutflows: number;
  cashInHand: number;
  totalPendingCobro: number;
  allSalesCount: number;
}

interface Venta {
  id: string;
  clientId?: string;
  clientName: string;
  sellerName: string;
  date: string;
  total: number;
  descuento?: number;
  metodoPago: string;
  nroFactura?: string;
  observaciones?: string;
  estado?: string;
  items: any[];
}

interface Abono {
  id: string;
  ventaId: string;
  monto: number;
  fecha: string;
  metodoPago: string;
  comprobante?: string;
  notas?: string;
  clienteId?: string;
  clienteNombre: string;
}

export const FinancesFeature: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"flow" | "sales" | "abonos">("flow");
  const [flowHistory, setFlowHistory] = useState<FlowDay[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalInflows: 0,
    totalOutflows: 0,
    cashInHand: 0,
    totalPendingCobro: 0,
    allSalesCount: 0,
  });
  const [sales, setSales] = useState<Venta[]>([]);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Caja / Flujo
      const flowRes = await fetch("/api/finanzas/flujo-caja");
      if (!flowRes.ok) throw new Error("Error al obtener flujo de caja");
      const flowData = await flowRes.json();
      setFlowHistory(flowData.flowHistory || []);
      setSummary(flowData.summary || {
        totalInflows: 0,
        totalOutflows: 0,
        cashInHand: 0,
        totalPendingCobro: 0,
        allSalesCount: 0,
      });

      // 2. Fetch Ventas para impresión
      const salesRes = await fetch("/api/ventas");
      if (!salesRes.ok) throw new Error("Error al obtener historial de ventas");
      const salesData = await salesRes.json();
      setSales(salesData || []);

      // 3. Fetch Abonos
      const abonosRes = await fetch("/api/finanzas/abonos");
      if (!abonosRes.ok) throw new Error("Error al obtener historial de abonos");
      const abonosData = await abonosRes.json();
      setAbonos(abonosData || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error al cargar datos financieros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Filtrar ventas
  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.clientName.toLowerCase().includes(q) ||
      (s.nroFactura && s.nroFactura.toLowerCase().includes(q)) ||
      s.id.includes(q)
    );
  });

  // Filtrar abonos
  const filteredAbonos = abonos.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.clienteNombre.toLowerCase().includes(q) ||
      a.ventaId.includes(q) ||
      a.id.includes(q) ||
      (a.comprobante && a.comprobante.toLowerCase().includes(q))
    );
  });

  // --- CÁLCULO DE COORDENADAS PARA SVG CHART ---
  const width = 800;
  const height = 280;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const maxVal = Math.max(
    ...flowHistory.map((d) => Math.max(d.inflows, d.outflows)),
    100 // evitar divisiones por cero si todo está en cero
  );

  const getCoordinates = (dayIndex: number, type: "inflows" | "outflows") => {
    if (flowHistory.length === 0) return { x: 0, y: 0 };
    const stepX = (width - paddingLeft - paddingRight) / (flowHistory.length - 1);
    const x = paddingLeft + dayIndex * stepX;
    
    const value = flowHistory[dayIndex][type];
    const usableHeight = height - paddingTop - paddingBottom;
    const y = height - paddingBottom - (value / maxVal) * usableHeight;
    
    return { x, y };
  };

  // Crear strings de línea y áreas SVG
  let inflowPoints = "";
  let outflowPoints = "";
  let inflowAreaPoints = "";
  let outflowAreaPoints = "";

  if (flowHistory.length > 0) {
    // Inflows
    const ptsIn = flowHistory.map((_, i) => {
      const { x, y } = getCoordinates(i, "inflows");
      return `${x},${y}`;
    });
    inflowPoints = ptsIn.join(" ");
    
    const lastPtIn = getCoordinates(flowHistory.length - 1, "inflows");
    inflowAreaPoints = `${paddingLeft},${height - paddingBottom} ${inflowPoints} ${lastPtIn.x},${height - paddingBottom}`;

    // Outflows
    const ptsOut = flowHistory.map((_, i) => {
      const { x, y } = getCoordinates(i, "outflows");
      return `${x},${y}`;
    });
    outflowPoints = ptsOut.join(" ");

    const lastPtOut = getCoordinates(flowHistory.length - 1, "outflows");
    outflowAreaPoints = `${paddingLeft},${height - paddingBottom} ${outflowPoints} ${lastPtOut.x},${height - paddingBottom}`;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera */}
      <div className="border-b border-border pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            Finanzas y Caja Comercial
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Flujo de ingresos reales, egresos operativos e impresión de comprobantes oficiales A4.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab("flow")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all hover-scale active-shrink ${
              activeSubTab === "flow"
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(0,149,255,0.35)]"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Flujo de Caja
          </button>
          <button
            onClick={() => { setActiveSubTab("sales"); setSearchQuery(""); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all hover-scale active-shrink ${
              activeSubTab === "sales"
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(0,149,255,0.35)]"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Comprobantes Ventas
          </button>
          <button
            onClick={() => { setActiveSubTab("abonos"); setSearchQuery(""); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all hover-scale active-shrink ${
              activeSubTab === "abonos"
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(0,149,255,0.35)]"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Comprobantes Abonos
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {activeSubTab === "flow" && (
            <div className="space-y-6 animate-zoomIn">
              {/* Tarjetas KPI */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale animate-pulseNeon">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Caja Fisi. en Mano</span>
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Wallet className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {formatMoney(summary.cashInHand)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Ventas Contado + Abonos - Compras
                  </p>
                </div>

                <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cuentas por Cobrar</span>
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-500 mt-2">
                    {formatMoney(summary.totalPendingCobro)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Saldo restante en ventas a Crédito
                  </p>
                </div>

                <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Ingresos (30d)</span>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-2">
                    {formatMoney(summary.totalInflows)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Ventas Contado + Abonos
                  </p>
                </div>

                <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Egresos (30d)</span>
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-red-400 mt-2">
                    {formatMoney(summary.totalOutflows)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Pagos totales a Proveedores
                  </p>
                </div>
              </div>

              {/* Gráfico SVG de Flujo */}
              <div className="bg-card/90 border border-border rounded-xl p-6 relative overflow-hidden">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
                  Historial de Movimientos de Caja (Últimos 30 Días)
                </h3>
                
                <div className="relative w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px] overflow-visible">
                    {/* Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const usableHeight = height - paddingTop - paddingBottom;
                      const y = height - paddingBottom - ratio * usableHeight;
                      const val = (ratio * maxVal).toFixed(0);
                      return (
                        <g key={ratio} className="opacity-20">
                          <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
                      <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-muted-foreground font-bold">{formatNumber(val)} Bs.</text>
                        </g>
                      );
                    })}

                    {/* Inflows Area & Line */}
                    {flowHistory.length > 0 && (
                      <>
                        <polygon points={inflowAreaPoints} className="fill-accent/5" />
                        <polyline points={inflowPoints} fill="none" className="stroke-accent" strokeWidth="3" />
                      </>
                    )}

                    {/* Outflows Area & Line */}
                    {flowHistory.length > 0 && (
                      <>
                        <polygon points={outflowAreaPoints} className="fill-red-500/5" />
                        <polyline points={outflowPoints} fill="none" className="stroke-red-500" strokeWidth="2" strokeDasharray="3,1" />
                      </>
                    )}

                    {/* X-axis labels */}
                    {flowHistory.map((day, i) => {
                      // Solo dibujar cada 4 días para no saturar el eje X
                      if (i % 4 !== 0 && i !== flowHistory.length - 1) return null;
                      const { x } = getCoordinates(i, "inflows");
                      return (
                        <text key={i} x={x} y={height - paddingBottom + 16} textAnchor="middle" className="text-[9px] fill-muted-foreground font-semibold">
                          {day.label}
                        </text>
                      );
                    })}

                    {/* Interactive dots and hover zones */}
                    {flowHistory.map((_, i) => {
                      const coordIn = getCoordinates(i, "inflows");
                      const coordOut = getCoordinates(i, "outflows");
                      return (
                        <g key={i}>
                          {/* Invisible capture bar for better UX */}
                          <rect
                            x={coordIn.x - 10}
                            y={0}
                            width="20"
                            height={height}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />

                          {/* Dots */}
                          {hoveredIndex === i && (
                            <>
                              <circle cx={coordIn.x} cy={coordIn.y} r="6" className="fill-accent stroke-background" strokeWidth="2" />
                              <circle cx={coordOut.x} cy={coordOut.y} r="5" className="fill-red-500 stroke-background" strokeWidth="2" />
                              
                              {/* Vertical guide line */}
                              <line x1={coordIn.x} y1={paddingTop} x2={coordIn.x} y2={height - paddingBottom} className="stroke-muted-foreground/30" strokeWidth="1" strokeDasharray="2,2" />
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Leyenda y Tooltip Flotante */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50 text-[10px]">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-4 rounded bg-accent block"></span>
                      <span className="font-bold text-muted-foreground uppercase">Ingresos (Ventas Contado + Abonos)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-4 rounded bg-red-500 block"></span>
                      <span className="font-bold text-muted-foreground uppercase">Egresos (Compras Recibidas)</span>
                    </div>
                  </div>

                  {hoveredIndex !== null && flowHistory[hoveredIndex] && (
                    <div className="bg-popover border border-border/80 px-3 py-2 rounded-lg text-xs flex gap-4 shadow-xl max-w-sm absolute right-6 top-6 animate-zoomIn">
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">{flowHistory[hoveredIndex].label}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-accent font-bold">+{formatMoney(flowHistory[hoveredIndex].inflows)}</span>
                          <span className="text-red-400 font-semibold">-{formatMoney(flowHistory[hoveredIndex].outflows)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "sales" && (
            <div className="space-y-4 animate-zoomIn">
              {/* Buscador */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar venta por cliente o factura..."
                  className="w-full bg-card/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Factura / ID</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Fecha</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Cliente</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Método Pago</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-right">Total</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-center">Imprimir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-sm text-muted-foreground italic">
                          No se encontraron ventas registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale) => (
                        <tr key={sale.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-bold text-foreground">
                            {sale.nroFactura || `VT-${sale.id.padStart(5, "0")}`}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(sale.date).toLocaleString("es-BO")}
                          </td>
                          <td className="p-4 font-semibold text-foreground">{sale.clientName}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sale.metodoPago === "Credito"
                                ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}>
                              {sale.metodoPago}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-foreground">
                            {formatMoney(sale.total)}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => imprimirFacturaA4(sale)}
                              className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Imprimir A4"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === "abonos" && (
            <div className="space-y-4 animate-zoomIn">
              {/* Buscador */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar abono por cliente, venta..."
                  className="w-full bg-card/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Recibo ID</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Venta Ref</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Fecha</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Cliente</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-left">Método Pago</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-right">Monto Abonado</th>
                      <th className="text-[10px] uppercase font-bold text-muted-foreground p-4 text-center">Imprimir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAbonos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-sm text-muted-foreground italic">
                          No se encontraron abonos registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredAbonos.map((abono) => (
                        <tr key={abono.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-bold text-foreground">
                            REC-{abono.id.padStart(5, "0")}
                          </td>
                          <td className="p-4 text-xs font-semibold text-muted-foreground">
                            Venta #{abono.ventaId}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(abono.fecha).toLocaleString("es-BO")}
                          </td>
                          <td className="p-4 font-semibold text-foreground">{abono.clienteNombre}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {abono.metodoPago}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-emerald-400">
                            {formatMoney(abono.monto)}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => imprimirReciboA4(abono)}
                              className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Imprimir A4"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
