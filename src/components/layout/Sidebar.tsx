import React from "react";
import type { UserSession } from "../../features/auth/types";
import {
  Bot,
  CircleDollarSign,
  ClipboardList,
  Coins,
  Flame,
  Layers,
  LayoutDashboard,
  LogOut,
  Truck,
  User,
  UserCheck,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";

interface SidebarProps {
  session: UserSession;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Centro de Control",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Vendedor", "Operario"] },
      { id: "ai_agent", label: "Agentes IA", icon: Bot, roles: ["Admin", "Vendedor", "Operario"] },
    ],
  },
  {
    title: "Comercial",
    items: [
      { id: "sales", label: "Ventas", icon: CircleDollarSign, roles: ["Admin", "Vendedor"] },
      { id: "clients", label: "Clientes y Cuentas", icon: UsersRound, roles: ["Admin", "Vendedor"] },
      { id: "finances", label: "Caja y Finanzas", icon: Coins, roles: ["Admin"] },
    ],
  },
  {
    title: "Almacen",
    items: [
      { id: "products", label: "Catalogo Repuestos", icon: Wrench, roles: ["Admin", "Vendedor"] },
      { id: "inventory", label: "Kardex Stock", icon: ClipboardList, roles: ["Admin", "Operario"] },
      { id: "purchases", label: "Compras", icon: Truck, roles: ["Admin", "Operario"] },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { id: "production", label: "Produccion Fabrica", icon: Layers, roles: ["Admin", "Operario"] },
    ],
  },
  {
    title: "Administracion",
    items: [
      { id: "users", label: "Usuarios y Roles", icon: UserCheck, roles: ["Admin"] },
      { id: "employees", label: "Empleados", icon: Users, roles: ["Admin"] },
      { id: "profile", label: "Mi Perfil", icon: User, roles: ["Admin", "Vendedor", "Operario"] },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const visibleMenuSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(session.role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col justify-between">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,149,255,0.4)]">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-foreground uppercase tracking-widest leading-none">
              Repuestos
            </h1>
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider leading-none">
              La Paz V3
            </span>
          </div>
        </div>

        <nav className="space-y-4">
          {visibleMenuSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/70">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 group active:scale-[0.98] ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_4px_10px_rgba(0,149,255,0.15)]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border bg-background/30 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center border border-border">
            {session.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-foreground leading-none">{session.employeeName}</p>
            <span className="text-[10px] text-muted-foreground leading-none">{session.role}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
};
