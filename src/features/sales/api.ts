import type { Cliente, Venta } from "./types";

const CLIENTS_URL = "/api/clientes";
const SALES_URL = "/api/ventas";

export const getClientes = async (): Promise<Cliente[]> => {
  const res = await fetch(CLIENTS_URL);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al cargar los clientes.");
  }
  return res.json();
};

export const saveCliente = async (cliente: {
  name: string;
  phone?: string;
  address?: string;
}): Promise<Cliente> => {
  const res = await fetch(CLIENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al guardar el cliente.");
  }
  return res.json();
};

export const getVentas = async (): Promise<Venta[]> => {
  const res = await fetch(SALES_URL);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al cargar el historial de ventas.");
  }
  return res.json();
};

export const processSale = async (sale: {
  clientId?: string;
  items: Array<{ productId: string; quantity: number; priceUnit: number }>;
  username: string;
  metodoPago: Venta["metodoPago"];
  descuento?: number;
  nroFactura?: string;
  observaciones?: string;
}): Promise<Venta> => {
  const res = await fetch(SALES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al procesar la venta.");
  }
  return res.json();
};
