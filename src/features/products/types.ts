export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number | null;
}

export interface Product {
  id: string;
  oem: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice?: number | null;
  stock: number;
  minStock: number;
  compatibility: string;
  providerName: string;
  brand?: string;
  location?: string;
  weight?: number | null;
  image?: string;
  notes?: string;
  status: "Activo" | "Descontinuado";
}
