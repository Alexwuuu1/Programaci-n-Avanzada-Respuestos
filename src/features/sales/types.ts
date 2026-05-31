export interface Cliente {
  id: string;
  name: string;
  phone: string;
  address: string;
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
  items: SaleItem[];
}
