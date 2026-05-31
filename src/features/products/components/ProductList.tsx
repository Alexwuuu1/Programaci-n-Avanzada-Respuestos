import React, { useState } from "react";
import type { Category, Product } from "../types";
import { Search, Edit, Trash2, AlertTriangle, Plus, FolderCog } from "lucide-react";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onDeleteProduct: (id: string) => void;
  onEditProduct: (p: Product) => void;
  onAddProductClick: () => void;
  onManageCategoriesClick: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  categories,
  onDeleteProduct,
  onEditProduct,
  onAddProductClick,
  onManageCategoriesClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || "Sin Categoría";
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.oem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.compatibility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border">
        {/* Buscador */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por repuesto, OEM o compatibilidad..."
              className="w-full rounded bg-input border border-border pr-3 pl-9 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Botones de Control */}
        <div className="flex gap-2">
          <button
            onClick={onManageCategoriesClick}
            className="flex items-center gap-1 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider border border-border bg-input text-muted-foreground hover:bg-muted transition-all active:scale-[0.98]"
          >
            <FolderCog className="h-4 w-4" />
            Categorías
          </button>
          <button
            onClick={onAddProductClick}
            className="flex items-center gap-1 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-accent transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo Repuesto
          </button>
        </div>
      </div>

      {/* Tabla Catálogo */}
      <div className="rounded-xl border border-border bg-card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="pb-3">Código OEM</th>
                <th className="pb-3">Repuesto</th>
                <th className="pb-3">Categoría</th>
                <th className="pb-3">Compatibilidad</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3">Precio</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock < 10;
                return (
                  <tr key={p.id} className="text-sm hover:bg-background/25 transition-all">
                    <td className="py-3.5 font-mono font-semibold text-primary">{p.oem}</td>
                    <td className="py-3.5 font-semibold text-foreground">
                      <div>
                        {p.name}
                        <div className="text-[10px] text-muted-foreground">Prov: {p.providerName}</div>
                      </div>
                    </td>
                    <td className="py-3.5 text-muted-foreground">{getCategoryName(p.categoryId)}</td>
                    <td className="py-3.5 text-muted-foreground max-w-xs truncate" title={p.compatibility}>
                      {p.compatibility}
                    </td>
                    <td className="py-3.5 font-semibold">
                      <span className={`flex items-center gap-1 ${isLowStock ? "text-destructive" : "text-foreground"}`}>
                        {isLowStock && <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-destructive" />}
                        {p.stock} pzas
                      </span>
                    </td>
                    <td className="py-3.5 text-foreground font-semibold">Bs. {p.price.toFixed(2)}</td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEditProduct(p)}
                          className="p-1.5 rounded bg-secondary text-foreground hover:bg-muted border border-border transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/25 transition-all border border-transparent hover:border-destructive/15"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron repuestos en el catálogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
