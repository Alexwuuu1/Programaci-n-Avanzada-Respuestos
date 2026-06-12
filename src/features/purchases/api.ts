import type { Proveedor, Compra } from "./types";

const PROV_URL = "/api/proveedores";
const COMP_URL = "/api/compras";

export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await fetch(PROV_URL);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al obtener proveedores.");
  }
  return res.json();
};

export const createProveedor = async (
  proveedor: Omit<Proveedor, "id" | "createdAt">
): Promise<Proveedor> => {
  const res = await fetch(PROV_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proveedor),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al crear el proveedor.");
  }
  return res.json();
};

export const updateProveedor = async (
  id: string,
  proveedor: Omit<Proveedor, "id" | "createdAt">
): Promise<Proveedor> => {
  const res = await fetch(`${PROV_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proveedor),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al actualizar el proveedor.");
  }
  return res.json();
};

export const deleteProveedor = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${PROV_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al eliminar el proveedor.");
  }
  return res.json();
};

export const getCompras = async (): Promise<Compra[]> => {
  const res = await fetch(COMP_URL);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al obtener compras.");
  }
  return res.json();
};

export const createCompra = async (
  providerId: string,
  items: Array<{ productId: string; quantity: number; pricePurchase: number }>,
  username: string,
  extra?: {
    fechaEntregaEstimada?: string;
    nroReferencia?: string;
    observaciones?: string;
  }
): Promise<Compra> => {
  const res = await fetch(COMP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId, items, username, ...extra }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al crear la orden de compra.");
  }
  return res.json();
};

export const cambiarEstadoCompra = async (
  id: string,
  status: "Recibido" | "Cancelado",
  username: string
): Promise<{ id: string; status: string; message: string }> => {
  const res = await fetch(`${COMP_URL}/${id}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, username }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al cambiar el estado del pedido.");
  }
  return res.json();
};
