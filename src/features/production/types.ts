export interface ProductionOrder {
  id: string;
  productId: string;
  productName: string;
  productOem: string;
  quantity: number;
  cantidadProducida?: number;
  prioridad: "Baja" | "Media" | "Alta" | "Urgente";
  costoProduccion?: number;
  observaciones?: string;
  startDate: string;
  endDate?: string;
  status: "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado";
  responsibleId?: string;
  responsibleName?: string;
}
