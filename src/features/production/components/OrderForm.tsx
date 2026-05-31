import React, { useState, useEffect } from "react";
import type { Product } from "../../products/types";
import { PlusCircle, Wrench, Users, Hash } from "lucide-react";

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
  }) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  products,
  onSubmit,
  onCancel,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedResponsibleId, setSelectedResponsibleId] = useState("");
  const [error, setError] = useState("");

  // Cargar lista de empleados para la asignación de responsable
  useEffect(() => {
    fetch("http://localhost:3000/api/empleados")
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
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
        <PlusCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Nueva Orden de Fabricación</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
            {error}
          </div>
        )}

        {/* Producto */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Wrench className="h-3.5 w-3.5 text-primary" /> Repuesto a Fabricar
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">-- Seleccionar de catálogo --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.oem}] {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Hash className="h-3.5 w-3.5 text-primary" /> Cantidad a Producir
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Responsable */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" /> Responsable de Torno/Fabricación
          </label>
          <select
            value={selectedResponsibleId}
            onChange={(e) => setSelectedResponsibleId(e.target.value)}
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">-- Sin asignar (Responsable automático) --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.position})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 border-t border-border pt-4 mt-6">
          <button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all active:scale-[0.98]"
          >
            Emitir Orden
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
