export interface ProductionOrder {
  id: string;
  productId: string;
  productName: string;
  productOem: string;
  quantity: number;
  startDate: string;
  endDate?: string;
  status: "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado";
  responsibleId?: string;
  responsibleName?: string;
}
