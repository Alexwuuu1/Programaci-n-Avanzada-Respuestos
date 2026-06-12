import React, { useEffect, useState } from "react";
import type { Product } from "../../products/types";
import type { ProductionOrder } from "../types";
import { Hash, PlusCircle, Users, Wrench } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  position: string;
  status: "Activo" | "Inactivo";
}

interface OrderFormProps {
  products: Product[];
  onSubmit: (orderData: {
    productId: string;
    quantity: number;
    responsibleId?: string;
    prioridad?: ProductionOrder["prioridad"];
    costoProduccion?: number;
    observaciones?: string;
  }) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ products, onSubmit, onCancel }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedResponsibleId, setSelectedResponsibleId] = useState("");
  const [prioridad, setPrioridad] = useState<ProductionOrder["prioridad"]>("Media");
  const [costoProduccion, setCostoProduccion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/empleados")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setEmployees(data.filter((e: Employee) => e.status === "Activo")))
      .catch(() => console.error("Error al obtener la lista de operarios."));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Por favor, selecciona un repuesto para fabricar.");
      return;
    }
    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    setError("");
    onSubmit({
      productId: selectedProductId,
      quantity,
      responsibleId: selectedResponsibleId || undefined,
      prioridad,
      costoProduccion: costoProduccion ? Number(costoProduccion) : undefined,
      observaciones: observaciones.trim() || undefined,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
        <PlusCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Nueva Orden de Fabricacion</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">{error}</div>}

        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Wrench className="h-3.5 w-3.5 text-primary" /> Repuesto a Fabricar
          </label>
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">-- Seleccionar de catalogo --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>[{p.oem}] {p.name} (Stock: {p.stock})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-primary" /> Cantidad a Producir
            </label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Prioridad</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as ProductionOrder["prioridad"])} className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" /> Responsable de Fabricacion
            </label>
            <select value={selectedResponsibleId} onChange={(e) => setSelectedResponsibleId(e.target.value)} className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">-- Sin asignar --</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Costo Produccion (Bs.)</label>
            <input type="number" min={0} step="0.01" value={costoProduccion} onChange={(e) => setCostoProduccion(e.target.value)} className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="0.00" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Observaciones</label>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" placeholder="Notas de fabricacion, lote o material" />
        </div>

        <div className="flex gap-3 border-t border-border pt-4 mt-6">
          <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all active:scale-[0.98]">Emitir Orden</button>
          <button type="button" onClick={onCancel} className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">Cancelar</button>
        </div>
      </form>
    </div>
  );
};
