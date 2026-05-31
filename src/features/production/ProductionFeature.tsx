import React, { useState, useEffect } from "react";
import type { ProductionOrder } from "./types";
import type { Product } from "../products/types";
import { OrderList } from "./components/OrderList";
import { OrderForm } from "./components/OrderForm";
import { getProductionOrders, createProductionOrder, updateOrderStatus } from "./api";
import { AlertCircle } from "lucide-react";

interface ProductionFeatureProps {
  products: Product[];
  onRefreshProducts: () => void;
}

type SubView = "list" | "form";

export const ProductionFeature: React.FC<ProductionFeatureProps> = ({
  products,
  onRefreshProducts,
}) => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [subView, setSubView] = useState<SubView>("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProductionOrders();
      setOrders(data);
    } catch (e: any) {
      setError(e.message || "Error al cargar las órdenes de producción.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreateOrder = async (orderData: {
    productId: string;
    quantity: number;
    responsibleId?: string;
  }) => {
    try {
      const created = await createProductionOrder(orderData);
      setOrders([created, ...orders]);
      setSubView("list");
    } catch (e: any) {
      alert(e.message || "Error al crear la orden.");
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado"
  ) => {
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders(orders.map((o) => (o.id === id ? updated : o)));

      // Si la orden finalizó, refrescar el stock de repuestos en el estado global
      if (status === "Finalizado") {
        onRefreshProducts();
      }
    } catch (e: any) {
      alert(e.message || "Error al actualizar la orden.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Title block */}
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold text-foreground">Control de Producción</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Planificación de fabricación de repuestos, asignación de tornos y control de lotes en planta.
        </p>
      </div>

      {/* Main View block */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-xs text-muted-foreground py-12">
          Cargando órdenes de fabricación...
        </div>
      ) : subView === "list" ? (
        <OrderList
          orders={orders}
          onStatusChange={handleStatusChange}
          onAddClick={() => setSubView("form")}
        />
      ) : (
        <OrderForm
          products={products}
          onSubmit={handleCreateOrder}
          onCancel={() => setSubView("list")}
        />
      )}
    </div>
  );
};
