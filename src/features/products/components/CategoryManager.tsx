import React, { useState } from "react";
import type { Category } from "../types";
import { FolderPlus, Trash2, Folder } from "lucide-react";

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("Esta categoría ya existe.");
      return;
    }
    setError("");
    onAddCategory(name.trim());
    setName("");
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Formulario Nueva Categoría */}
      <div className="rounded-xl border border-border bg-card p-6 h-fit">
        <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
          <FolderPlus className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Nueva Categoría</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Motor, Frenos"
              className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all active:scale-[0.98]"
          >
            Agregar Categoría
          </button>
        </form>
      </div>

      {/* Lista de Categorías */}
      <div className="rounded-xl border border-border bg-card p-6 md:col-span-2">
        <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
          <Folder className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Categorías Registradas</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all"
            >
              <span className="text-sm font-semibold text-foreground">{c.name}</span>
              <button
                onClick={() => onDeleteCategory(c.id)}
                className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/25 transition-all"
                title="Eliminar Categoría"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
