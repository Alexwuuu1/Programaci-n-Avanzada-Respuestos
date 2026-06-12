import type { CRMCliente } from "./types";

const BASE_URL = "/api/clientes";

export const getClientesCRM = async (): Promise<CRMCliente[]> => {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al obtener clientes.");
  }
  return res.json();
};

export const createClienteCRM = async (
  cliente: Partial<CRMCliente> & { name: string }
): Promise<CRMCliente> => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al registrar cliente.");
  }
  return res.json();
};

export const updateClienteCRM = async (
  id: string,
  cliente: Partial<CRMCliente> & { name: string }
): Promise<CRMCliente> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al actualizar cliente.");
  }
  return res.json();
};

export const deleteClienteCRM = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al eliminar cliente.");
  }
  return res.json();
};

export const getClienteEstadoCuenta = async (clienteId: string): Promise<any> => {
  const res = await fetch(`/api/abonos/cliente/${clienteId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al obtener estado de cuenta.");
  }
  return res.json();
};

export const registrarAbono = async (abono: {
  ventaId: string;
  monto: number;
  metodoPago: string;
  comprobante?: string;
  notas?: string;
}): Promise<any> => {
  const res = await fetch("/api/abonos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(abono),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al registrar abono.");
  }
  return res.json();
};
