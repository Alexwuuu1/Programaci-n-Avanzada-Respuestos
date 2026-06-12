import React, { useEffect, useMemo, useState } from "react";
import type { Category, Product } from "../types";
import { Check, ChevronLeft, ChevronRight, ImageIcon, Package, PlusCircle, Save, Upload, X } from "lucide-react";

interface ProductFormProps {
  categories: Category[];
  products: Product[];
  onSubmitProduct: (p: Omit<Product, "id"> & { id?: string }) => void;
  editingProduct?: Product | null;
  onCancel: () => void;
}

type ProductFormStep = "identidad" | "precioStock" | "ubicacion" | "imagenCompatibilidad";

const steps: Array<{ id: ProductFormStep; label: string; hint: string }> = [
  { id: "identidad", label: "Identidad", hint: "OEM, nombre y categoria" },
  { id: "precioStock", label: "Precio y stock", hint: "Margen y alertas" },
  { id: "ubicacion", label: "Proveedor", hint: "Ubicacion y peso" },
  { id: "imagenCompatibilidad", label: "Catalogo", hint: "Imagen y vehiculos" },
];

const STOCK_IMAGES = [
  { name: "Piston", url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&auto=format&fit=crop" },
  { name: "Bujia", url: "https://images.unsplash.com/photo-1635843468508-30117466eb96?w=300&auto=format&fit=crop" },
  { name: "Amortiguador", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop" },
  { name: "Filtro", url: "https://images.unsplash.com/photo-1607603750909-408e19385117?w=300&auto=format&fit=crop" },
  { name: "Disco Freno", url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop" },
  { name: "Motor", url: "https://images.unsplash.com/photo-1517524006129-4a3a3f6898d3?w=300&auto=format&fit=crop" },
  { name: "Faro LED", url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=300&auto=format&fit=crop" },
  { name: "Bateria", url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&auto=format&fit=crop" },
];

const InputClass = "h-11 w-full rounded-lg bg-input border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary";

export const ProductForm: React.FC<ProductFormProps> = ({
  categories,
  products,
  onSubmitProduct,
  editingProduct,
  onCancel,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [oem, setOem] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [providerName, setProviderName] = useState("");
  const [price, setPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [location, setLocation] = useState("");
  const [weight, setWeight] = useState("");
  const [status, setStatus] = useState<Product["status"]>("Activo");
  const [image, setImage] = useState("");
  const [compatibility, setCompatibility] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const activeStep = steps[stepIndex];
  const categoryName = categories.find((c) => c.id === categoryId)?.name || "Sin categoria";
  const duplicateProduct = products.find((p) => p.oem.trim().toLowerCase() === oem.trim().toLowerCase() && p.id !== editingProduct?.id);
  const isLocalImage = image.startsWith("data:image/");
  const margin = price - costPrice;
  const marginPercent = costPrice > 0 ? (margin / costPrice) * 100 : 0;

  const compatibilityChips = useMemo(() => {
    return compatibility
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [compatibility]);

  useEffect(() => {
    if (editingProduct) {
      setOem(editingProduct.oem);
      setName(editingProduct.name);
      setBrand(editingProduct.brand || "");
      setCategoryId(editingProduct.categoryId);
      setProviderName(editingProduct.providerName);
      setPrice(editingProduct.price);
      setCostPrice(editingProduct.costPrice || 0);
      setStock(editingProduct.stock);
      setMinStock(editingProduct.minStock ?? 5);
      setLocation(editingProduct.location || "");
      setWeight(editingProduct.weight?.toString() || "");
      setStatus(editingProduct.status || "Activo");
      setImage(editingProduct.image || "");
      setCompatibility(editingProduct.compatibility);
      setNotes(editingProduct.notes || "");
    } else {
      setOem("");
      setName("");
      setBrand("");
      setCategoryId(categories[0]?.id || "");
      setProviderName("");
      setPrice(0);
      setCostPrice(0);
      setStock(0);
      setMinStock(5);
      setLocation("");
      setWeight("");
      setStatus("Activo");
      setImage("");
      setCompatibility("");
      setNotes("");
    }
    setStepIndex(0);
    setError("");
  }, [editingProduct, categories]);

  const validateStep = (stepId = activeStep.id) => {
    setError("");

    if (stepId === "identidad") {
      if (!oem.trim() || !name.trim() || !categoryId) {
        setError("OEM, nombre y categoria son obligatorios.");
        return false;
      }
      if (duplicateProduct) {
        setError(`El OEM ${oem.trim().toUpperCase()} ya existe: ${duplicateProduct.name}.`);
        return false;
      }
    }

    if (stepId === "precioStock") {
      if (price <= 0) {
        setError("El precio de venta debe ser mayor a 0.");
        return false;
      }
      if (costPrice < 0 || stock < 0 || minStock < 0) {
        setError("Costo y stock no pueden ser negativos.");
        return false;
      }
    }

    if (stepId === "ubicacion" && !providerName.trim()) {
      setError("El proveedor principal es obligatorio.");
      return false;
    }

    if (stepId === "imagenCompatibilidad" && !compatibility.trim()) {
      setError("La compatibilidad de vehiculos es obligatoria.");
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (stepIndex < steps.length - 1) {
      goNext();
      return;
    }

    for (const step of steps) {
      if (!validateStep(step.id)) {
        setStepIndex(steps.findIndex((item) => item.id === step.id));
        return;
      }
    }

    onSubmitProduct({
      id: editingProduct?.id,
      oem: oem.trim().toUpperCase(),
      name: name.trim(),
      brand: brand.trim() || undefined,
      categoryId,
      price,
      costPrice: costPrice > 0 ? costPrice : null,
      stock,
      minStock,
      location: location.trim() || undefined,
      weight: weight ? Number(weight) : null,
      status,
      image: image.trim() || undefined,
      compatibility: compatibility.trim(),
      providerName: providerName.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid max-h-[88vh] gap-6 overflow-y-auto rounded-xl border border-border bg-card p-7 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              {editingProduct ? "Editar Repuesto" : "Registrar Nuevo Repuesto"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Modo completo por fases para cargar el catalogo con datos confiables.</p>
          </div>
          {error && <span className="max-w-md rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</span>}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => {
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (index <= stepIndex || validateStep()) setStepIndex(index);
                }}
                className={`min-h-[92px] rounded-lg border p-4 text-left transition-all ${
                  active ? "border-primary bg-primary/10" : done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-background/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Fase {index + 1}</span>
                  {done ? <Check className="h-4 w-4 text-emerald-400" /> : null}
                </div>
                <p className="mt-1 text-sm font-black text-foreground">{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/70 bg-background/25 p-5">
        {activeStep.id === "identidad" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Codigo OEM / Pieza *">
              <input value={oem} onChange={(e) => setOem(e.target.value)} placeholder="ej: 13011-22010" className={`${InputClass} ${duplicateProduct ? "border-destructive focus:border-destructive" : ""}`} autoFocus />
              {duplicateProduct && <p className="mt-1 text-[10px] font-bold text-destructive">Ya registrado: {duplicateProduct.name}</p>}
            </Field>
            <Field label="Nombre del Repuesto *"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Piston Motor Toyota 1.8" className={InputClass} /></Field>
            <Field label="Marca"><input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="ej: Toyota, Bosch, SKF" className={InputClass} /></Field>
            <Field label="Categoria *">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={InputClass}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select value={status} onChange={(e) => setStatus(e.target.value as Product["status"])} className={InputClass}>
                <option value="Activo">Activo</option>
                <option value="Descontinuado">Descontinuado</option>
              </select>
            </Field>
            <InfoBox title="Identificacion clara" text="El OEM y el nombre son la base para busquedas, ventas y consultas del agente IA." />
          </div>
        )}

        {activeStep.id === "precioStock" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Precio Venta (Bs.) *"><input type="number" min={0} step="0.01" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} placeholder="0.00" className={InputClass} /></Field>
              <Field label="Costo Compra (Bs.)"><input type="number" min={0} step="0.01" value={costPrice || ""} onChange={(e) => setCostPrice(Number(e.target.value))} placeholder="0.00" className={InputClass} /></Field>
              <Field label="Stock Actual"><input type="number" min={0} value={stock || ""} onChange={(e) => setStock(Number(e.target.value))} placeholder="0" className={InputClass} /></Field>
              <Field label="Stock Minimo">
                <input type="number" min={0} value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} placeholder="5" className={InputClass} />
                <div className="mt-2 flex gap-1.5">
                  {[5, 10, 20].map((value) => (
                    <button key={value} type="button" onClick={() => setMinStock(value)} className="rounded border border-border bg-background/40 px-2 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground">
                      {value}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className={`rounded-lg border p-4 ${costPrice > 0 && margin < 0 ? "border-destructive/30 bg-destructive/10" : "border-primary/20 bg-primary/5"}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Margen estimado</p>
              <p className={`mt-1 text-2xl font-black ${costPrice > 0 && margin < 0 ? "text-destructive" : "text-primary"}`}>
                Bs. {margin.toFixed(2)} {costPrice > 0 ? `(${marginPercent.toFixed(1)}%)` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {costPrice > 0 && margin < 0 ? "El costo supera al precio de venta. Revisa antes de guardar." : "Este calculo ayuda al dashboard y decisiones de precio."}
              </p>
            </div>
          </div>
        )}

        {activeStep.id === "ubicacion" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Proveedor Principal *"><input value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="ej: Metalurgica El Alto" className={InputClass} /></Field>
            <Field label="Ubicacion"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ej: Estante A3" className={InputClass} /></Field>
            <Field label="Peso (kg)"><input type="number" min={0} step="0.001" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.000" className={InputClass} /></Field>
            <div className="rounded-lg border border-border bg-background/35 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ubicaciones rapidas</p>
              <div className="flex flex-wrap gap-2">
                {["Estante A3", "Pasillo B-2", "Cajon E-1", "Bodega 2"].map((value) => (
                  <button key={value} type="button" onClick={() => setLocation(value)} className="rounded border border-border bg-card px-2 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground">
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeStep.id === "imagenCompatibilidad" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <div className="aspect-square">
                  {image ? <img src={image} alt="Vista previa" className="h-full w-full object-cover" /> : <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"><ImageIcon className="h-8 w-8 text-primary" />Sin foto</div>}
                </div>
              </div>
              <div className="space-y-3">
                <Field label={isLocalImage ? "Imagen local cargada" : "URL de imagen"}>
                  {isLocalImage ? (
                    <div className="flex h-11 items-center justify-between rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                      <span className="truncate text-xs font-bold text-emerald-300">Foto local lista para guardar</span>
                      <span className="text-[10px] text-muted-foreground">base64 oculto</span>
                    </div>
                  ) : (
                    <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Pegar URL de imagen (https://...)" className={InputClass} />
                  )}
                </Field>
                <div className="flex flex-wrap gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded border border-border bg-muted px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-muted/80">
                    <Upload className="h-4 w-4" />
                    Subir foto local
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {image && <button type="button" onClick={() => setImage("")} className="flex items-center gap-1 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-destructive"><X className="h-4 w-4" /> Quitar</button>}
                </div>
                <div className="rounded border border-border/50 bg-muted/20 p-2">
                  <span className="block text-[9px] uppercase font-bold text-primary tracking-wider">Galeria rapida</span>
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {STOCK_IMAGES.map((img) => (
                      <button key={img.name} type="button" onClick={() => setImage(img.url)} className={`relative h-12 w-16 shrink-0 overflow-hidden rounded border transition-all hover:scale-105 ${image === img.url ? "border-primary shadow-[0_0_8px_rgba(0,149,255,0.4)]" : "border-border"}`}>
                        <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-0.5 text-center text-[7px] font-bold text-white">{img.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Field label="Compatibilidad de Vehiculos *"><input value={compatibility} onChange={(e) => setCompatibility(e.target.value)} placeholder="ej: Toyota Corolla 2003-2008, Toyota Matrix 1.8L" className={InputClass} /></Field>
            {compatibilityChips.length > 0 && <div className="flex flex-wrap gap-2">{compatibilityChips.map((item) => <span key={item} className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{item}</span>)}</div>}
            <Field label="Notas"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observaciones internas del repuesto" className={InputClass} /></Field>
          </div>
        )}
        </div>

        <div className="flex justify-between gap-3 border-t border-border pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-[0.98]">
            Cancelar
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStepIndex(Math.max(0, stepIndex - 1))} disabled={stepIndex === 0} className="flex items-center gap-1 px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Atras
            </button>
            {stepIndex < steps.length - 1 ? (
              <button type="button" onClick={goNext} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all">
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all flex items-center gap-1 active:scale-[0.98]">
                <Save className="h-4 w-4" />
                Guardar Repuesto
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-background/35 p-5 h-fit space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Package className="h-5 w-5 text-primary" />
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Resumen</h4>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-muted/25">
          <div className="aspect-[16/10]">
            {image ? <img src={image} alt={name || "Repuesto"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin imagen</div>}
          </div>
        </div>
        <Summary label="OEM" value={oem || "Pendiente"} />
        <Summary label="Repuesto" value={name || "Sin nombre"} />
        <Summary label="Categoria" value={categoryName} />
        <Summary label="Precio" value={`Bs. ${price.toFixed(2)}`} />
        <Summary label="Stock" value={`${stock} pzas / min ${minStock}`} />
        <Summary label="Margen" value={costPrice > 0 ? `Bs. ${margin.toFixed(2)} (${marginPercent.toFixed(1)}%)` : "Sin costo"} danger={costPrice > 0 && margin < 0} />
        <Summary label="Ubicacion" value={location || "Sin ubicacion"} />
        <Summary label="Estado" value={status} />
      </aside>
    </form>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</label>
    {children}
  </div>
);

const InfoBox = ({ title, text }: { title: string; text: string }) => (
  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
    <strong className="block text-foreground">{title}</strong>
    {text}
  </div>
);

const Summary = ({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) => (
  <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-2 text-xs last:border-b-0">
    <span className="text-muted-foreground">{label}</span>
    <strong className={`max-w-[180px] text-right ${danger ? "text-destructive" : "text-foreground"}`}>{value}</strong>
  </div>
);
