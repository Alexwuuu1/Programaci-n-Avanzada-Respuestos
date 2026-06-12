import { useState, useEffect } from "react";
import type { UserSession } from "./features/auth/types";
import { ToastContainer, toast } from "./components/ui/Toast";
import { LoginView } from "./features/auth/components/LoginView";
import { Sidebar } from "./components/layout/Sidebar";
import { DashboardOverview } from "./features/dashboard/components/DashboardOverview";
import { UserManagement } from "./features/users/components/UserManagement";
import { EmployeeList } from "./features/employees/components/EmployeeList";
import { AlertCircle } from "lucide-react";
import { ProductsFeature } from "./features/products/ProductsFeature";
import type { Product, Category } from "./features/products/types";
import { ProductionFeature } from "./features/production/ProductionFeature";
import { SalesFeature } from "./features/sales/SalesFeature";
import { InventoryFeature } from "./features/inventory/InventoryFeature";
import { PurchasesFeature } from "./features/purchases/PurchasesFeature";
import { ClientsFeature } from "./features/clients/ClientsFeature";
import { FinancesFeature } from "./features/finances/FinancesFeature";
import { ProfileFeature } from "./features/profile/ProfileFeature";
import { ChatAgentFeature } from "./features/ai_agent/ChatAgentFeature";

function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Leer sesión guardada en localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem("userSession");
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem("userSession");
      }
    }
  }, []);

  const reloadProducts = () => {
    fetch("/api/productos")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((e) => console.error("Error al recargar productos del catálogo:", e));
  };

  // Cargar datos de catálogo desde la base de datos cuando inicia sesión
  useEffect(() => {
    if (session) {
      reloadProducts();

      fetch("/api/productos/categorias")
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => setCategories(data))
        .catch((e) => console.error("Error al cargar categorías del catálogo:", e));
    }
  }, [session]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setSession(null);
    setActiveTab("dashboard");
    toast.success("Cierre de sesión exitoso. ¡Hasta pronto!");
  };

  // Renderizar la vista activa
  const renderContent = () => {
    if (!session) return null;

    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview session={session} onNavigate={setActiveTab} />;
      case "clients":
        return <ClientsFeature />;
      case "users":
        return session.role === "Admin" ? <UserManagement /> : <AccessDenied />;
      case "employees":
        return session.role === "Admin" ? <EmployeeList /> : <AccessDenied />;
      case "products":
        return (
          <ProductsFeature 
            products={products}
            setProducts={setProducts}
            categories={categories}
            setCategories={setCategories}
          />
        );
      case "production":
        return (
          <ProductionFeature 
            products={products}
            onRefreshProducts={reloadProducts}
          />
        );
      case "sales":
        return (
          <SalesFeature 
            products={products}
            username={session.username}
            onRefreshProducts={reloadProducts}
          />
        );
      case "inventory":
        return <InventoryFeature />;
      case "finances":
        return session.role === "Admin" ? <FinancesFeature /> : <AccessDenied />;
      case "purchases":
        return (
          <PurchasesFeature 
            products={products}
            username={session.username}
            onRefreshProducts={reloadProducts}
          />
        );
      case "profile":
        return <ProfileFeature session={session} />;
      case "ai_agent":
        return <ChatAgentFeature />;
      default:
        return <PlaceholderView tabName={activeTab} />;
    }
  };

  if (!session) {
    return <LoginView onLogin={setSession} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar 
        session={session} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 overflow-y-auto bg-background/50">
        <div key={activeTab} className="h-full w-full animate-fadeIn">
          {renderContent()}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}

const AccessDenied = () => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <AlertCircle className="h-16 w-16 text-destructive mb-4 animate-bounce" />
    <h2 className="text-2xl font-bold text-foreground">Acceso Denegado</h2>
    <p className="text-sm text-muted-foreground mt-2">
      No tienes permisos suficientes para visualizar este módulo.
    </p>
  </div>
);

interface PlaceholderViewProps {
  tabName: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ tabName }) => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <div className="rounded-full bg-primary/10 border border-primary/20 p-4 text-primary mb-4">
      <AlertCircle className="h-10 w-10" />
    </div>
    <h2 className="text-2xl font-bold text-foreground capitalize">
      Módulo en Construcción
    </h2>
    <p className="text-sm text-muted-foreground mt-2 max-w-md">
      El módulo <span className="font-semibold text-primary">"{tabName}"</span> se encuentra contemplado en la arquitectura inicial y será desarrollado en la siguiente fase de implementación.
    </p>
  </div>
);

export default App;
