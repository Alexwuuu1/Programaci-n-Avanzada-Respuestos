import React, { useState, useEffect } from "react";
import type { Cliente, Venta } from "./types";
import type { Product } from "../products/types";
import { SaleForm } from "./components/SaleForm";
import { SaleHistory } from "./components/SaleHistory";
import { getClientes, saveCliente, getVentas, processSale } from "./api";
import { FileSpreadsheet, History, AlertCircle } from "lucide-react";

interface SalesFeatureProps {
  products: Product[];
  username: string;
  onRefreshProducts: () => void;
}

type TabType = "invoice" | "history";

export const SalesFeature: React.FC<SalesFeatureProps> = ({
  products,
  username,
  onRefreshProducts,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("invoice");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sales, setSales] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [cData, sData] = await Promise.all([getClientes(), getVentas()]);
      setClientes(cData);
      setSales(sData);
    } catch (e: any) {
      setError(e.message || "Error al cargar la información de ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCliente = async (clienteData: { name: string; phone?: string; address?: string }) => {
    try {
      const created = await saveCliente(clienteData);
      setClientes([created, ...clientes]);
    } catch (e: any) {
      alert(e.message || "Error al registrar el cliente.");
    }
  };

  const handleProcessSale = async (saleData: { clientId?: string; items: any[] }) => {
    try {
      const payload = {
        clientId: saleData.clientId,
        username,
        items: saleData.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          priceUnit: i.priceUnit,
        })),
      };

      const createdSale = await processSale(payload);
      setSales([createdSale, ...sales]);
      onRefreshProducts(); // Actualizar stock de repuestos en el catálogo
      setActiveTab("history");
      alert("¡Venta procesada con éxito!");
    } catch (e: any) {
      alert(e.message || "Error al procesar la venta.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-5 sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro de Ventas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Facturación a talleres clientes y consulta de historial de caja.
          </p>
        </div>
        {/* Toggle subtabs */}
        <div className="flex bg-muted p-1 rounded-lg border border-border self-start">
          <button
            onClick={() => setActiveTab("invoice")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "invoice" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" /> Nueva Boleta
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "history" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4" /> Historial
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-xs text-muted-foreground py-12">
          Cargando información del módulo...
        </div>
      ) : activeTab === "invoice" ? (
        <SaleForm
          products={products}
          clientes={clientes}
          username={username}
          onAddCliente={handleAddCliente}
          onSubmitSale={handleProcessSale}
        />
      ) : (
        <SaleHistory sales={sales} />
      )}
    </div>
  );
};
