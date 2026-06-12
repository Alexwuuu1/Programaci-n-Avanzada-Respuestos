import React, { useState } from "react";
import type { Category, Product } from "../types";
import { Search, Edit, Trash2, AlertTriangle, Plus, FolderCog, FileSpreadsheet, Printer, Grid2X2, Table2 } from "lucide-react";
import { exportarAExcel } from "../../../utils/exportUtils";
import { imprimirReporteA4 } from "../../finances/utils/printUtils";
import { formatMoney } from "../../../lib/formatters";

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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || "Sin Categoría";
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.oem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.compatibility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExportExcel = () => {
    exportarAExcel("Inventario_Catalogo", [
      { header: "OEM Código", key: "oem" },
      { header: "Repuesto", key: "name" },
      { header: "Marca", key: "brand" },
      { header: "Categoría", key: "categoryId", transform: (val: any) => getCategoryName(val) },
      { header: "Stock", key: "stock" },
      { header: "Precio Venta (Bs.)", key: "price" },
      { header: "Costo Compra (Bs.)", key: "costPrice", transform: (val: any) => val != null ? val : "" },
      { header: "Ubicación", key: "location" },
      { header: "Proveedor", key: "providerName" },
      { header: "Estado", key: "status" },
    ], filteredProducts);
  };

  const handlePrintPDF = () => {
    const dataToPrint = filteredProducts.map(p => ({
      oem: p.oem,
      name: p.name,
      brand: p.brand || "S/M",
      categoryName: getCategoryName(p.categoryId),
      stock: `${p.stock} pzas`,
      price: formatMoney(p.price),
      location: p.location || "S/U"
    }));
    
    const categoryFilterDesc = selectedCategory === "all" ? "Todas" : getCategoryName(selectedCategory);
    const filterText = `Búsqueda: "${searchTerm || 'Ninguna'}" | Categoría: "${categoryFilterDesc}"`;

    imprimirReporteA4(
      "Reporte de Catálogo de Repuestos",
      ["OEM Código", "Descripción", "Marca", "Categoría", "Stock", "Precio Venta", "Ubicación"],
      ["oem", "name", "brand", "categoryName", "stock", "price", "location"],
      dataToPrint,
      filterText
    );
  };

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
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded border border-border bg-input p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista tabla"
            >
              <Table2 className="h-4 w-4" />
              Tabla
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista tarjetas"
            >
              <Grid2X2 className="h-4 w-4" />
              Tarjetas
            </button>
          </div>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Exportar listado actual a Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Imprimir listado en PDF A4"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={onManageCategoriesClick}
            className="flex items-center gap-1 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider border border-border bg-input text-muted-foreground hover:bg-muted transition-all active:scale-[0.98] cursor-pointer"
          >
            <FolderCog className="h-4 w-4" />
            Categorías
          </button>
          <button
            onClick={onAddProductClick}
            className="flex items-center gap-1 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-accent transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo Repuesto
          </button>
        </div>
      </div>

      {/* Tabla Catálogo */}
      {viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minStock;
            const margin = p.costPrice && p.costPrice > 0 ? p.price - p.costPrice : null;
            const marginPercent = margin != null ? (margin / p.price) * 100 : null;

            return (
              <div key={p.id} className={`group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${p.status === "Descontinuado" ? "opacity-60" : ""}`}>
                <div className="relative aspect-[4/3] bg-muted/20">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Sin imagen</div>
                  )}
                  <div className="absolute left-3 top-3 rounded bg-background/85 px-2 py-1 font-mono text-[10px] font-black text-primary backdrop-blur">{p.oem}</div>
                  <span className={`absolute right-3 top-3 rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-wider backdrop-blur ${p.status === "Activo" ? "border-green-500/20 bg-green-500/15 text-green-300" : "border-border bg-background/80 text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 text-sm font-black uppercase tracking-wide text-foreground group-hover:text-primary">{p.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{p.brand || "Sin marca"} - {getCategoryName(p.categoryId)}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <ProductCardStat label="Precio" value={formatMoney(p.price)} />
                    <ProductCardStat label="Stock" value={`${p.stock}`} danger={isLowStock} />
                    <ProductCardStat label="Margen" value={marginPercent != null ? `${marginPercent.toFixed(0)}%` : "N/A"} warning={marginPercent != null && marginPercent < 15} />
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/30 p-3 text-xs">
                    <p className="flex justify-between gap-2"><span className="text-muted-foreground">Proveedor</span><strong className="text-right text-foreground">{p.providerName}</strong></p>
                    <p className="flex justify-between gap-2"><span className="text-muted-foreground">Ubicacion</span><strong className="text-right text-foreground">{p.location || "Sin ubicacion"}</strong></p>
                    {isLowStock && <p className="flex items-center gap-1 pt-1 text-[10px] font-bold uppercase text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Stock bajo, minimo {p.minStock}</p>}
                  </div>

                  <p className="line-clamp-2 min-h-[32px] text-xs text-muted-foreground" title={p.compatibility}>{p.compatibility}</p>

                  <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
                    <button onClick={() => onEditProduct(p)} className="flex items-center gap-1 rounded border border-border bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground transition-all hover:bg-muted" title="Editar">
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button onClick={() => onDeleteProduct(p.id)} className="rounded border border-destructive/15 bg-destructive/10 p-1.5 text-destructive transition-all hover:bg-destructive/25" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No se encontraron repuestos en el catalogo.
            </div>
          )}
        </div>
      ) : (
      <div className="rounded-xl border border-border bg-card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="pb-3">Código OEM</th>
                <th className="pb-3">Repuesto</th>
                <th className="pb-3">Categoría</th>
                <th className="pb-3">Marca / Ubicacion</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3">Precios / Margen</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.minStock;
                const margin = p.costPrice && p.costPrice > 0 ? p.price - p.costPrice : null;
                const marginPercent = margin != null ? (margin / p.price) * 100 : null;
                return (
                  <tr key={p.id} className={`text-sm hover:bg-background/25 transition-all ${p.status === "Descontinuado" ? "opacity-60" : ""}`}>
                    <td className="py-3.5 font-mono font-semibold text-primary">{p.oem}</td>
                    <td className="py-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded border border-border bg-muted/20 overflow-hidden flex items-center justify-center shrink-0">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[8px] text-muted-foreground uppercase font-bold text-center">N/A</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">Prov: {p.providerName}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-xs" title={p.compatibility}>{p.compatibility}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-muted-foreground">{getCategoryName(p.categoryId)}</td>
                    <td className="py-3.5 text-muted-foreground">
                      <div className="font-semibold text-foreground">{p.brand || "Sin marca"}</div>
                      <div className="text-[10px]">{p.location || "Sin ubicacion"}</div>
                    </td>
                    <td className="py-3.5 font-semibold">
                      <span className={`flex items-center gap-1 ${isLowStock ? "text-destructive" : "text-foreground"}`}>
                        {isLowStock && <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-destructive" />}
                        {p.stock} pzas
                      </span>
                      <span className="text-[10px] text-muted-foreground">min: {p.minStock}</span>
                    </td>
                    <td className="py-3.5 text-foreground font-semibold">
                      <div>Venta: {formatMoney(p.price)}</div>
                      <div className="text-[10px] text-muted-foreground">Costo: {p.costPrice ? formatMoney(p.costPrice) : "N/A"}</div>
                      {marginPercent != null && (
                        <div className={`text-[10px] ${marginPercent < 15 ? "text-yellow-400" : "text-green-400"}`}>
                          Margen: {marginPercent.toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        p.status === "Activo" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-muted border-border text-muted-foreground"
                      }`}>
                        {p.status}
                      </span>
                    </td>
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
                  <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron repuestos en el catálogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

const ProductCardStat = ({ label, value, danger = false, warning = false }: { label: string; value: string; danger?: boolean; warning?: boolean }) => (
  <div className={`rounded-lg border p-2 ${danger ? "border-destructive/25 bg-destructive/10" : warning ? "border-yellow-500/25 bg-yellow-500/10" : "border-border bg-background/35"}`}>
    <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    <strong className={`mt-0.5 block truncate text-xs font-black ${danger ? "text-destructive" : warning ? "text-yellow-400" : "text-foreground"}`}>{value}</strong>
  </div>
);
