export interface ClientPurchase {
  id: string;
  date: string;
  total: number;
}

export interface CRMCliente {
  id: string;
  name: string;
  phone: string;
  address: string;
  nit?: string | null;
  email?: string | null;
  tipo?: "Taller" | "Particular" | "Empresa" | string;
  vehiculos?: string | null;
  nivelFidelidad?: "Nuevo" | "Frecuente" | "VIP" | string;
  descuentoPorcentaje?: number | null;
  limiteCredito?: number | null;
  notas?: string | null;
  estado?: "Activo" | "Inactivo" | string;
  salesCount: number;
  totalSpent: number;
  saldoDeudor?: number;
  purchaseHistory?: ClientPurchase[];
}
