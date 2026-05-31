export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  productOem: string;
  type: "Entrada" | "Salida" | "Ajuste";
  quantity: number;
  date: string;
  reason: string;
  responsibleName: string;
}
