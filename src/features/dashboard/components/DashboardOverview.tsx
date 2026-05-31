import React, { useState, useEffect } from "react";
import type { UserSession } from "../../auth/types";
import { 
  Package, 
  Layers, 
  ShoppingCart, 
  AlertTriangle, 
  Activity 
} from "lucide-react";

interface DashboardOverviewProps {
  session: UserSession;
}

interface DashboardData {
  salesToday: number;
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
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ session }) => {
  const isAdmin = session.role === "Admin";
  const isVendedor = session.role === "Vendedor";
  const isOperario = session.role === "Operario";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/dashboard/kpis")
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* KPI 1: Ventas / Clientes */}
        {(isAdmin || isVendedor) && (
          <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,69,0,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Ventas Registradas Hoy</span>
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">Bs. {loading ? "..." : data?.salesToday}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{loading ? "Calculando..." : `${data?.transactionsCount} transacciones aprobadas hoy`}</p>
          </div>
        )}

        {/* KPI 2: Inventario / Stock */}
        {(isAdmin || isOperario) && (
          <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,69,0,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Materiales en Inventario</span>
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{loading ? "..." : `${data?.stockTotal} pzas`}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{loading ? "Cargando..." : `${data?.categoriesCount} categorías de repuestos en catálogo`}</p>
          </div>
        )}

        {/* KPI 3: Producción en Curso */}
        {(isAdmin || isOperario) && (
          <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,69,0,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Piezas en Producción</span>
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{loading ? "..." : `${data?.activeProduction} repuestos`}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tornos y fundición activos en planta</p>
          </div>
        )}

        {/* KPI 4: Alertas de Stock */}
        {(isAdmin || isOperario) && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 transition-all hover:border-destructive/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-destructive">Alertas de Bajo Inventario</span>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-destructive">{loading ? "..." : `${data?.lowStockAlerts} ítems`}</span>
            </div>
            <p className="mt-2 text-xs text-destructive-foreground">Repuestos bajo nivel crítico (≤ 5 unidades)</p>
          </div>
        )}
      </div>

      {/* Sección Informativa / Asimetría Visual */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Actividad Reciente del Sistema</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Cargando actividad reciente...</p>
            ) : data?.recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No hay actividad reciente registrada hoy.</p>
            ) : (
              data?.recentActivity.map((act) => (
                <div key={act.id} className={`flex items-start gap-3 border-l-2 ${act.border} pl-3`}>
                  <div className="text-xs text-muted-foreground">{act.time}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{act.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Trazabilidad Industrial</h3>
            <p className="text-sm text-muted-foreground">
              Nuestra plataforma está optimizada para la trazabilidad total de piezas y el seguimiento exacto de las órdenes de trabajo desde el Alto de La Paz hasta los almacenes centrales.
            </p>
          </div>
          <div className="mt-6 rounded-lg bg-background p-4 border border-border">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Nota del Módulo de Producción:</h4>
            <p className="text-xs text-muted-foreground">
              Recuerda asociar los materiales consumidos a cada lote de fabricación para reflejar los descuentos en el inventario real en tiempo de ejecución.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
