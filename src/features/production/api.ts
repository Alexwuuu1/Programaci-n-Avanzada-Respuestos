import type { ProductionOrder } from "./types";

const BASE_URL = "http://localhost:3000/api/produccion";

export const getProductionOrders = async (): Promise<ProductionOrder[]> => {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al obtener las órdenes de producción.");
  }
  return res.json();
};

export const createProductionOrder = async (order: {
  productId: string;
  quantity: number;
  responsibleId?: string;
}): Promise<ProductionOrder> => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al crear la orden de producción.");
  }
  return res.json();
};

export const updateOrderStatus = async (
  id: string,
  status: "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado"
): Promise<ProductionOrder> => {
  const res = await fetch(`${BASE_URL}/${id}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al actualizar el estado de la orden.");
  }
  return res.json();
};
