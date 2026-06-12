import React, { useState, useEffect } from "react";
import type { UserSession } from "../../auth/types";
import { toast } from "../../../components/ui/Toast";
import { formatMoney, formatNumber, formatPercent } from "../../../lib/formatters";
import { 
  Layers, 
  ShoppingCart, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  DollarSign,
  Truck,
  Plus,
  AlertCircle
} from "lucide-react";

interface DashboardOverviewProps {
  session: UserSession;
  onNavigate?: (tab: string) => void;
}

interface LowStockItem {
  id: string;
  name: string;
  oem: string;
  stock: number;
  minStock: number;
  suggestedReplenish: number;
}

interface ReplenishmentGroup {
  providerId: string | null;
  providerName: string;
  items: LowStockItem[];
}

interface ProductNoCost {
  id: string;
  name: string;
  oem: string;
  price: number;
}

interface TopProductItem {
  id: string;
  name: string;
  oem: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
}

interface DashboardData {
  salesToday: number;
  profitToday: number;
  transactionsCount: number;
  stockTotal: number;
  lowStockAlerts: number;
  activeProduction: number;
  categoriesCount: number;
  recentActivity: Array<{
    id: string;
    time: string;
    title: string;
    desc: string;
    border: string;
  }>;
  last7Days: Array<{ label: string; ingresos: number; ganancias: number }>;
  paymentDistribution: Record<string, number>;
  replenishments: ReplenishmentGroup[];
  productsNoCost: ProductNoCost[];
  topProducts: TopProductItem[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ session, onNavigate }) => {
  const isAdmin = session.role === "Admin";
  const isVendedor = session.role === "Vendedor";
  const isOperario = session.role === "Operario";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDot, setHoveredDot] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/kpis")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((kpis) => {
        setData(kpis);
      })
      .catch((e) => console.error("Error al cargar KPIs del dashboard:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleGeneratePurchase = (group: ReplenishmentGroup) => {
    if (!group.providerId) {
      toast.error("No se puede generar un pedido automático para repuestos sin proveedor asignado.");
      return;
    }
    const dataToSave = {
      providerId: group.providerId,
      items: group.items.map((item) => ({
        productId: item.id,
        quantity: item.suggestedReplenish,
      })),
    };
    localStorage.setItem("autoPurchaseData", JSON.stringify(dataToSave));
    onNavigate?.("purchases");
  };

  // Lógica de cálculo de coordenadas para el gráfico SVG
  const renderLineChart = () => {
    if (!data || data.last7Days.length === 0) return null;

    const width = 450;
    const height = 150;
    const padding = 35;

    const maxVal = Math.max(
      ...data.last7Days.map((d) => Math.max(d.ingresos, d.ganancias)),
      100 // Evitar división por cero
    );

    const getX = (index: number) => padding + (index * (width - padding * 2)) / 6;
    const getY = (value: number) => height - padding - (value * (height - padding * 2)) / maxVal;

    const pointsIngresos = data.last7Days.map((d, i) => `${getX(i)},${getY(d.ingresos)}`).join(" ");
    const pointsGanancias = data.last7Days.map((d, i) => `${getX(i)},${getY(d.ganancias)}`).join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        <defs>
          <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0095ff" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#0095ff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="gananciasGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Líneas de cuadrícula horizontales */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = getY(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className="stroke-border/30 stroke-1" strokeDasharray="4 4" />
              <text x={padding - 5} y={y + 3} className="fill-muted-foreground text-[8px] font-mono text-right" textAnchor="end">
                {formatNumber(Math.round(maxVal * ratio))}
              </text>
            </g>
          );
        })}

        {/* Eje X Etiquetas */}
        {data.last7Days.map((d, i) => (
          <text key={i} x={getX(i)} y={height - 10} className="fill-muted-foreground text-[8px] font-bold text-center" textAnchor="middle">
            {d.label.split(" ")[0]}
          </text>
        ))}

        {/* Polígono Ingresos (Shading) */}
        <polygon 
          points={`${padding},${height - padding} ${pointsIngresos} ${width - padding},${height - padding}`} 
          fill="url(#ingresosGrad)" 
        />
        
        {/* Polígono Ganancias (Shading) */}
        <polygon 
          points={`${padding},${height - padding} ${pointsGanancias} ${width - padding},${height - padding}`} 
          fill="url(#gananciasGrad)" 
        />

        {/* Línea de Ingresos (Cian) */}
        <polyline points={pointsIngresos} fill="none" className="stroke-primary stroke-2" filter="url(#glow)" />
        {data.last7Days.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.ingresos);
          return (
            <circle 
              key={`ing-${i}`} 
              cx={cx} 
              cy={cy} 
              r="3.5" 
              className="fill-background stroke-primary stroke-2 cursor-pointer hover:r-5 transition-all"
              onMouseEnter={() => setHoveredDot({
                type: "ingresos",
                x: cx,
                y: cy,
                value: formatMoney(d.ingresos),
                date: d.label
              })}
              onMouseLeave={() => setHoveredDot(null)}
            />
          );
        })}

        {/* Línea de Ganancias (Verde Esmeralda) */}
        <polyline points={pointsGanancias} fill="none" className="stroke-emerald-400 stroke-2" filter="url(#glow)" />
        {data.last7Days.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.ganancias);
          return (
            <circle 
              key={`gan-${i}`} 
              cx={cx} 
              cy={cy} 
              r="3.5" 
              className="fill-background stroke-emerald-400 stroke-2 cursor-pointer hover:r-5 transition-all"
              onMouseEnter={() => setHoveredDot({
                type: "ganancias",
                x: cx,
                y: cy,
                value: formatMoney(d.ganancias),
                date: d.label
              })}
              onMouseLeave={() => setHoveredDot(null)}
            />
          );
        })}

        {/* Floating Tooltip Box */}
        {hoveredDot && (
          <g>
            <rect
              x={Math.max(padding + 10, Math.min(width - padding - 110, hoveredDot.x - 50))}
              y={hoveredDot.y - 38}
              width="100"
              height="30"
              rx="6"
              className="fill-slate-950/95 stroke-border/50 stroke-1"
            />
            <text
              x={Math.max(padding + 60, Math.min(width - padding - 60, hoveredDot.x))}
              y={hoveredDot.y - 26}
              className="fill-muted-foreground text-[7.5px] font-bold text-center uppercase tracking-wider"
              textAnchor="middle"
            >
              {hoveredDot.date}
            </text>
            <text
              x={Math.max(padding + 60, Math.min(width - padding - 60, hoveredDot.x))}
              y={hoveredDot.y - 14}
              className={`text-[8.5px] font-black text-center ${
                hoveredDot.type === "ingresos" ? "fill-cyan-400" : "fill-emerald-400"
              }`}
              textAnchor="middle"
            >
              {hoveredDot.type === "ingresos" ? "Ingreso: " : "Utilidad: "}{hoveredDot.value}
            </text>
          </g>
        )}
      </svg>
    );
  };

  const totalPayments = data
    ? Object.values(data.paymentDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido, <span className="font-semibold text-primary">{session.employeeName}</span> — Rol: <span className="text-foreground">{session.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          Sistema en Línea (La Paz)
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Ventas Hoy */}
        {(isAdmin || isVendedor) && (
          <div className="relative rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/40 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,149,255,0.08)] overflow-hidden group">
            <span className="absolute top-0 right-0 h-1 w-20 bg-gradient-to-r from-transparent to-primary rounded-bl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ingreso de Hoy</span>
              <ShoppingCart className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{loading ? "..." : formatMoney(data?.salesToday)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{loading ? "Calculando..." : `${data?.transactionsCount} ventas completadas hoy`}</p>
            {!loading && data && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <span>Meta Diaria (1.500 Bs.)</span>
                  <span>{formatPercent(Math.min(100, (data.salesToday / 1500) * 100))}</span>
                </div>
                <div className="h-1 w-full rounded bg-muted overflow-hidden border border-border/20">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-cyan-400 shadow-[0_0_8px_rgba(0,149,255,0.35)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (data.salesToday / 1500) * 100)}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* KPI 2: Utilidad Neta Hoy */}
        {isAdmin && (
          <div className="relative rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/40 p-6 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.08)] overflow-hidden group">
            <span className="absolute top-0 right-0 h-1 w-20 bg-gradient-to-r from-transparent to-emerald-500 rounded-bl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Utilidad Neta Hoy</span>
              <DollarSign className="h-5 w-5 text-emerald-400 transition-transform group-hover:scale-110" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">{loading ? "..." : formatMoney(data?.profitToday)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Rentabilidad neta en caja
            </p>
            {!loading && data && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <span>Meta Utilidad (800 Bs.)</span>
                  <span>{formatPercent(Math.min(100, (data.profitToday / 800) * 100))}</span>
                </div>
                <div className="h-1 w-full rounded bg-muted overflow-hidden border border-border/20">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(16,185,129,0.35)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (data.profitToday / 800) * 100)}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* KPI 3: Alertas de Stock */}
        {(isAdmin || isOperario) && (
          <div className={`relative rounded-xl border p-6 transition-all duration-300 overflow-hidden group ${
            data && data.lowStockAlerts > 0 
              ? "border-red-500/30 bg-gradient-to-br from-red-500/5 to-card/40 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.08)]" 
              : "border-border/60 bg-gradient-to-br from-card to-card/40 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,149,255,0.08)]"
          }`}>
            <span className={`absolute top-0 right-0 h-1 w-20 bg-gradient-to-r from-transparent to-red-500 rounded-bl ${data && data.lowStockAlerts > 0 ? "opacity-100" : "opacity-0"}`} />
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${data && data.lowStockAlerts > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                Stock Crítico
              </span>
              <AlertTriangle className={`h-5 w-5 transition-transform group-hover:scale-110 ${data && data.lowStockAlerts > 0 ? "text-red-400 animate-bounce" : "text-primary"}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black ${data && data.lowStockAlerts > 0 ? "text-red-400" : "text-foreground"}`}>
                {loading ? "..." : `${formatNumber(data?.lowStockAlerts)} items`}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Productos bajo nivel mínimo configurado</p>
            {!loading && data && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <span>Estado Almacén</span>
                  <span className={data.lowStockAlerts > 0 ? "text-red-400 font-bold" : "text-green-400"}>
                    {data.lowStockAlerts > 0 ? "Crítico" : "Óptimo"}
                  </span>
                </div>
                <div className="h-1 w-full rounded bg-muted overflow-hidden border border-border/20">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      data.lowStockAlerts > 0 
                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.35)]" 
                        : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.35)]"
                    }`} 
                    style={{ width: data.lowStockAlerts > 0 ? "100%" : "0%" }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* KPI 4: Producción en Curso */}
        {(isAdmin || isOperario) && (
          <div className="relative rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/40 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,149,255,0.08)] overflow-hidden group">
            <span className="absolute top-0 right-0 h-1 w-20 bg-gradient-to-r from-transparent to-purple-500 rounded-bl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Producción Activa</span>
              <Layers className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{loading ? "..." : `${formatNumber(data?.activeProduction)} ordenes`}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Tornos y operarios en planta</p>
            {!loading && data && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <span>Capacidad Planta (Máx. 5)</span>
                  <span>{formatPercent(Math.min(100, (data.activeProduction / 5) * 100))}</span>
                </div>
                <div className="h-1 w-full rounded bg-muted overflow-hidden border border-border/20">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.35)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (data.activeProduction / 5) * 100)}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gráficos de Negocio */}
      {isAdmin && !loading && data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Gráfico 1: Ingresos vs Ganancias */}
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Historial Financiero Semanal</h3>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1 text-primary"><span className="h-2 w-2 rounded-full bg-primary" /> Ingresos</span>
                <span className="flex items-center gap-1 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Ganancias</span>
              </div>
            </div>
            <div className="flex items-center justify-center p-2 bg-background/35 rounded-lg border border-border/30">
              {renderLineChart()}
            </div>
          </div>

          {/* Gráfico 2: Canales de Pago */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border/50 pb-2">Ventas por Método de Pago (Últimos 30 días)</h3>
            <div className="space-y-3.5 mt-2">
              {Object.entries(data.paymentDistribution).map(([method, val]) => {
                const pct = totalPayments > 0 ? (val / totalPayments) * 100 : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{method}</span>
                      <span className="text-muted-foreground">{formatMoney(val)} ({formatPercent(Math.round(pct))})</span>
                    </div>
                    <div className="h-2 w-full rounded bg-muted/65 overflow-hidden border border-border/20">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-cyan-400 shadow-[0_0_8px_rgba(0,149,255,0.35)] rounded transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
              {totalPayments === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">Sin registros en el último mes.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sección Operativa y Alertas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Top Repuestos Más Vendidos */}
        {isAdmin && !loading && data && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Top Repuestos Más Vendidos
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase border border-primary/25">Rotación Alta</span>
            </div>
            
            <div className="space-y-3.5 mt-2 max-h-[300px] overflow-y-auto pr-1">
              {data.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-2 bg-background/35 rounded-lg border border-border/30 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[9px] text-muted-foreground font-mono block">[{p.oem}]</span>
                        <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                        <span className="text-[9px] text-muted-foreground block truncate">{p.categoryName}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-foreground block">{formatNumber(p.quantitySold)} pzas</span>
                      <span className="text-[10px] text-muted-foreground">{formatMoney(p.revenue)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border rounded-lg bg-muted/5 font-mono">
                  No hay registros de ventas.
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Panel de Reposición Directa */}
        {(isAdmin || isOperario) && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Reposición de Inventario Crítico</h3>
              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold uppercase border border-red-500/25">Acción Necesaria</span>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-muted-foreground py-10 text-center">Cargando sugerencias de compra...</p>
              ) : data?.replenishments.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border rounded-lg bg-muted/5 font-mono">
                  Todos los repuestos tienen stock suficiente (≥ stock mínimo).
                </div>
              ) : (
                data?.replenishments.map((group, idx) => (
                  <div key={idx} className="rounded-lg border border-border/50 bg-background/40 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/20 transition-all">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground uppercase">{group.providerName}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.items.slice(0, 3).map((item) => (
                          <span key={item.id} className="text-[9px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-medium">
                            {item.oem} (-{item.suggestedReplenish})
                          </span>
                        ))}
                        {group.items.length > 3 && (
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/25 px-1.5 py-0.5 rounded font-bold">
                            +{group.items.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                    {group.providerId ? (
                      <button onClick={() => handleGeneratePurchase(group)} className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-bold rounded uppercase tracking-wider transition-all whitespace-nowrap self-stretch sm:self-center justify-center">
                        <Plus className="h-3 w-3" /> Generar Pedido
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold italic">Pendiente asociar proveedor</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Actividad Reciente del Sistema */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border/50 pb-2 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Cargando actividad reciente...</p>
            ) : data?.recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No hay actividad reciente registrada hoy.</p>
            ) : (
              data?.recentActivity.map((act) => (
                <div key={act.id} className={`flex items-start gap-3 border-l-2 ${act.border} pl-3`}>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{act.time}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{act.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Productos sin Costo configurado */}
      {isAdmin && !loading && data && data.productsNoCost.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 flex items-start gap-3.5">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Repuestos sin Costo de Compra Configurado</h4>
            <p className="text-xs text-muted-foreground">
              Para que tu utilidad y reportes de margen sean exactos, asigna un Costo de Compra en el módulo de Inventario a las siguientes piezas:
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {data.productsNoCost.slice(0, 8).map((p) => (
                <span key={p.id} className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded font-mono font-bold">
                  [{p.oem}] {p.name}
                </span>
              ))}
              {data.productsNoCost.length > 8 && (
                <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold border border-border">
                  y {data.productsNoCost.length - 8} más
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
