export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  oem: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  compatibility: string;
  providerName: string;
}
