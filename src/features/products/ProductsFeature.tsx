import React, { useState } from "react";
import type { Product, Category } from "./types";
import { ProductList } from "./components/ProductList";
import { ProductForm } from "./components/ProductForm";
import { CategoryManager } from "./components/CategoryManager";
import { X } from "lucide-react";
import { saveProduct, deleteProduct, saveCategory, deleteCategory } from "./api";
import { toast } from "../../components/ui/Toast";

interface ProductsFeatureProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

type SubView = "list" | "form" | "categories";

export const ProductsFeature: React.FC<ProductsFeatureProps> = ({
  products,
  setProducts,
  categories,
  setCategories,
}) => {
  const [subView, setSubView] = useState<SubView>("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAddProduct = async (newProd: Omit<Product, "id"> & { id?: string }) => {
    try {
      const savedProd = await saveProduct(newProd);
      if (newProd.id) {
        setProducts(products.map((p) => (p.id === newProd.id ? savedProd : p)));
      } else {
        setProducts([savedProd, ...products]);
      }
      setSubView("list");
      setEditingProduct(null);
      toast.success("¡Repuesto registrado en el catálogo!");
    } catch (e: any) {
      const message = e.message || "Error al registrar el producto.";
      toast.error(message.includes("OEM") ? "Ese codigo OEM ya existe. Revisa el campo Codigo OEM / Pieza." : message);
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setSubView("form");
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este repuesto del catálogo?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
        toast.success("¡Repuesto eliminado!");
      } catch (e: any) {
        toast.error(e.message || "Error al eliminar el producto.");
      }
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const createdCat = await saveCategory(name);
      setCategories([...categories, createdCat]);
      toast.success("¡Categoría creada!");
    } catch (e: any) {
      toast.error(e.message || "Error al agregar la categoría.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (products.some((p) => p.categoryId === id)) {
      toast.warning("No puedes eliminar una categoría que contiene repuestos asociados.");
      return;
    }
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter((c) => c.id !== id));
        toast.success("¡Categoría eliminada!");
      } catch (e: any) {
        toast.error(e.message || "Error al eliminar la categoría.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Título de la Sección */}
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold text-foreground">Catálogo de Repuestos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catálogo técnico y control de existencias físicas.
        </p>
      </div>

      {/* Listado principal siempre visible de fondo */}
      <ProductList
        products={products}
        categories={categories}
        onDeleteProduct={handleDeleteProduct}
        onEditProduct={handleEditClick}
        onAddProductClick={() => setSubView("form")}
        onManageCategoriesClick={() => setSubView("categories")}
      />

      {/* Modal del Formulario de Producto */}
      {subView === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-6xl my-auto animate-zoomIn">
            <ProductForm
              categories={categories}
              products={products}
              onSubmitProduct={handleAddProduct}
              editingProduct={editingProduct}
              onCancel={() => {
                setSubView("list");
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal del Gestor de Categorías */}
      {subView === "categories" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl my-auto bg-card border border-border p-6 rounded-xl shadow-2xl relative animate-zoomIn">
            <button
              onClick={() => setSubView("list")}
              className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
};
