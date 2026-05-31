import React, { useState } from "react";
import type { Product, Category } from "./types";
import { ProductList } from "./components/ProductList";
import { ProductForm } from "./components/ProductForm";
import { CategoryManager } from "./components/CategoryManager";
import { ChevronLeft } from "lucide-react";
import { saveProduct, deleteProduct, saveCategory, deleteCategory } from "./api";

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
    } catch (e: any) {
      alert(e.message || "Error al registrar el producto.");
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
      } catch (e: any) {
        alert(e.message || "Error al eliminar el producto.");
      }
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const createdCat = await saveCategory(name);
      setCategories([...categories, createdCat]);
    } catch (e: any) {
      alert(e.message || "Error al agregar la categoría.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (products.some((p) => p.categoryId === id)) {
      alert("No puedes eliminar una categoría que contiene repuestos asociados.");
      return;
    }
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter((c) => c.id !== id));
      } catch (e: any) {
        alert(e.message || "Error al eliminar la categoría.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Título de la Sección con Botón de Regreso si aplica */}
      <div className="flex items-center gap-3 border-b border-border pb-5">
        {subView !== "list" && (
          <button
            onClick={() => {
              setSubView("list");
              setEditingProduct(null);
            }}
            className="p-2 rounded bg-card border border-border hover:bg-muted text-foreground transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catálogo de Repuestos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subView === "list"
              ? "Catálogo técnico y control de existencias físicas."
              : subView === "form"
              ? "Edición y registro de ficha técnica del componente."
              : "Administración de agrupaciones mecánicas."}
          </p>
        </div>
      </div>

      {/* Renderizado de Sub-Vistas */}
      {subView === "list" && (
        <ProductList
          products={products}
          categories={categories}
          onDeleteProduct={handleDeleteProduct}
          onEditProduct={handleEditClick}
          onAddProductClick={() => setSubView("form")}
          onManageCategoriesClick={() => setSubView("categories")}
        />
      )}

      {subView === "form" && (
        <ProductForm
          categories={categories}
          onSubmitProduct={handleAddProduct}
          editingProduct={editingProduct}
          onCancel={() => {
            setSubView("list");
            setEditingProduct(null);
          }}
        />
      )}

      {subView === "categories" && (
        <CategoryManager
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
    </div>
  );
};
