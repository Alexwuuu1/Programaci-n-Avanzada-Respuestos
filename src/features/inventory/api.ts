import type { InventoryMovement } from "./types";

const BASE_URL = "http://localhost:3000/api/inventario";

export const getInventoryMovements = async (): Promise<InventoryMovement[]> => {
  const res = await fetch(`${BASE_URL}/movimientos`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al obtener el historial de trazabilidad.");
  }
  return res.json();
};
