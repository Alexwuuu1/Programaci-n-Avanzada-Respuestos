import type { Product, Category } from "./types";

const BASE_URL = "http://localhost:3000/api/productos";

export const getProducts = async (): Promise<Product[]> => {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al cargar los productos.");
  }
  return res.json();
};

export const saveProduct = async (
  newProd: Omit<Product, "id"> & { id?: string }
): Promise<Product> => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newProd),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al guardar el producto.");
  }
  return res.json();
};

export const deleteProduct = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al eliminar el producto.");
  }
};

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${BASE_URL}/categorias`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al cargar las categorías.");
  }
  return res.json();
};

export const saveCategory = async (name: string): Promise<Category> => {
  const res = await fetch(`${BASE_URL}/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al guardar la categoría.");
  }
  return res.json();
};

export const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/categorias/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al eliminar la categoría.");
  }
};
