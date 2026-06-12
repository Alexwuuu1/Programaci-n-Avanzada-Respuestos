export interface Proveedor {
  id: string;
  name: string;
  nit?: string;
  email?: string;
  phone: string;
  secondaryPhone?: string;
  mainContact?: string;
  address: string;
  paymentTerms?: string;
  rating?: number | null;
  notes?: string;
  status?: "Activo" | "Inactivo" | string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  productOem: string;
  quantity: number;
  pricePurchase: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  providerId: string;
  providerName: string;
  buyerName: string;
  date: string;
  fechaEntregaEstimada?: string;
  fechaRecepcion?: string;
  nroReferencia?: string;
  observaciones?: string;
  status: string; // "Pendiente", "Recibido", "Cancelado"
  total: number;
  items: PurchaseItem[];
}
