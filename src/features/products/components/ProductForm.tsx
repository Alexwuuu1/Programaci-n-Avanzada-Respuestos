import React, { useState, useEffect } from "react";
import type { Category, Product } from "../types";
import { PlusCircle, Save } from "lucide-react";

interface ProductFormProps {
  categories: Category[];
  onSubmitProduct: (p: Omit<Product, "id"> & { id?: string }) => void;
  editingProduct?: Product | null;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  categories,
  onSubmitProduct,
  editingProduct,
  onCancel,
}) => {
  const [oem, setOem] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [compatibility, setCompatibility] = useState("");
  const [providerName, setProviderName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingProduct) {
      setOem(editingProduct.oem);
      setName(editingProduct.name);
      setCategoryId(editingProduct.categoryId);
      setPrice(editingProduct.price);
      setStock(editingProduct.stock);
      setCompatibility(editingProduct.compatibility);
      setProviderName(editingProduct.providerName);
    } else {
      setOem("");
      setName("");
      setCategoryId(categories[0]?.id || "");
      setPrice(0);
      setStock(0);
      setCompatibility("");
      setProviderName("");
    }
  }, [editingProduct, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !oem.trim() || !categoryId || !compatibility.trim() || !providerName.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (price <= 0 || stock < 0) {
      setError("El precio debe ser mayor a 0 y el stock no puede ser negativo.");
      return;
    }
    setError("");
    onSubmitProduct({
      id: editingProduct?.id,
      oem: oem.trim().toUpperCase(),
      name: name.trim(),
      categoryId,
      price,
      stock,
      compatibility: compatibility.trim(),
      providerName: providerName.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary" />
          {editingProduct ? "Editar Repuesto" : "Registrar Nuevo Repuesto"}
        </h3>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Código OEM / Pieza</label>
          <input
            type="text"
            value={oem}
            onChange={(e) => setOem(e.target.value)}
            placeholder="ej: 13011-22010"
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nombre del Repuesto</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej: Pistón Motor Toyota 1.8"
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Proveedor Principal</label>
          <input
            type="text"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="ej: Metalúrgica El Alto"
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Precio Unitario (Bs.)</label>
          <input
            type="number"
            value={price || ""}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="0.00"
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Stock Inicial</label>
          <input
            type="number"
            value={stock || ""}
            onChange={(e) => setStock(Number(e.target.value))}
            placeholder="0"
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Compatibilidad de Vehículos</label>
          <input
            type="text"
            value={compatibility}
            onChange={(e) => setCompatibility(e.target.value)}
            placeholder="ej: Toyota Corolla 2003-2008, Toyota Matrix 1.8L"
            className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all flex items-center gap-1 active:scale-[0.98]"
        >
          <Save className="h-4 w-4" />
          Guardar Repuesto
        </button>
      </div>
    </form>
  );
};
