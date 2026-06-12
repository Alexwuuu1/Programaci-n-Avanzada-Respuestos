export interface Cliente {
  id: string;
  name: string;
  phone: string;
  address: string;
  nit?: string | null;
  email?: string | null;
  tipo?: string;
  nivelFidelidad?: string;
  descuentoPorcentaje?: number | null;
}

export interface SaleItem {
  productId: string;
  productName: string;
  productOem: string;
  quantity: number;
  priceUnit: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  clientId?: string;
  clientName: string;
  sellerName: string;
  date: string;
  total: number;
  descuento?: number;
  metodoPago: "Efectivo" | "Transferencia" | "QR" | "Tarjeta" | "Credito";
  nroFactura?: string;
  observaciones?: string;
  estado?: "Completada" | "Anulada";
  items: SaleItem[];
}
