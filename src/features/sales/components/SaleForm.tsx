import React, { useMemo, useState } from "react";
import type { Product } from "../../products/types";
import type { Cliente } from "../types";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ImageIcon,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "../../../components/ui/Toast";
import { formatMoney, formatNumber } from "../../../lib/formatters";

interface SaleFormProps {
  products: Product[];
  clientes: Cliente[];
  username: string;
  onAddCliente: (c: { name: string; phone?: string; address?: string }) => Promise<void>;
  onSubmitSale: (saleData: {
    clientId?: string;
    items: any[];
    metodoPago: "Efectivo" | "Transferencia" | "QR" | "Tarjeta" | "Credito";
    descuento?: number;
    nroFactura?: string;
    observaciones?: string;
  }) => void;
}

type StepId = "cliente" | "productos" | "pago" | "revision";

const steps: Array<{ id: StepId; label: string; hint: string }> = [
  { id: "cliente", label: "Cliente", hint: "Selecciona o crea" },
  { id: "productos", label: "Repuestos", hint: "Arma el carrito" },
  { id: "pago", label: "Pago", hint: "Metodo y factura" },
  { id: "revision", label: "Revision", hint: "Confirma venta" },
];

export const SaleForm: React.FC<SaleFormProps> = ({
  products,
  clientes,
  username,
  onAddCliente,
  onSubmitSale,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Transferencia" | "QR" | "Tarjeta" | "Credito">("Efectivo");
  const [descuento, setDescuento] = useState(0);
  const [nroFactura, setNroFactura] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedClient = clientes.find((c) => c.id === selectedClientId);
  const paymentMethods: Array<typeof metodoPago> = ["Efectivo", "QR", "Transferencia", "Tarjeta", "Credito"];

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.priceUnit, 0), [cart]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.oem, product.brand, product.compatibility, product.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [productSearch, products]);
  const total = Math.max(0, subtotal - descuento);
  const unitCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeStep = steps[stepIndex];

  const canContinue =
    activeStep.id === "cliente" ||
    (activeStep.id === "productos" && cart.length > 0) ||
    activeStep.id === "pago" ||
    activeStep.id === "revision";

  const setSafeQuantity = (value: number) => {
    const max = selectedProduct?.stock || 999;
    setQuantity(Math.max(1, Math.min(max, Math.floor(Number(value) || 1))));
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    if (quantity <= 0 || quantity > selectedProduct.stock) {
      toast.error(`Cantidad no valida. Stock disponible: ${formatNumber(selectedProduct.stock)}`);
      return;
    }

    const existingItem = cart.find((item) => item.productId === selectedProduct.id);
    if (existingItem) {
      const nextQty = existingItem.quantity + quantity;
      if (nextQty > selectedProduct.stock) {
        toast.error(`No puedes exceder el stock disponible de ${formatNumber(selectedProduct.stock)} unidades.`);
        return;
      }
      setCart(cart.map((item) => item.productId === selectedProduct.id ? { ...item, quantity: nextQty } : item));
    } else {
      setCart([
        ...cart,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          oem: selectedProduct.oem,
          quantity,
          priceUnit: selectedProduct.price,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    await onAddCliente({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || undefined,
      address: newClientAddress.trim() || undefined,
    });
    setNewClientName("");
    setNewClientPhone("");
    setNewClientAddress("");
    setShowAddClient(false);
  };

  const processSale = () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un repuesto antes de procesar la venta.");
      setStepIndex(1);
      return;
    }

    onSubmitSale({
      clientId: selectedClientId || undefined,
      items: cart,
      metodoPago,
      descuento: descuento > 0 ? descuento : undefined,
      nroFactura: nroFactura.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
    });

    setCart([]);
    setSelectedClientId("");
    setDescuento(0);
    setNroFactura("");
    setObservaciones("");
    setStepIndex(0);
  };

  const renderStep = () => {
    if (activeStep.id === "cliente") {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-foreground">Cliente de la venta</h3>
              <p className="text-xs text-muted-foreground">Puedes vender a Cliente General o seleccionar un cliente CRM.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddClient(!showAddClient)}
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/15"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo
            </button>
          </div>

          {showAddClient ? (
            <form onSubmit={handleSaveClient} className="grid gap-3 rounded-lg border border-border bg-background/40 p-4 md:grid-cols-3">
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nombre cliente o taller"
                className="rounded bg-input border border-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                required
              />
              <input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Telefono"
                className="rounded bg-input border border-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button className="rounded bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                Crear Cliente
              </button>
            </form>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedClientId("")}
              className={`rounded-lg border p-4 text-left transition-all ${!selectedClientId ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/40"}`}
            >
              <p className="text-sm font-black text-foreground">Cliente General</p>
              <p className="mt-1 text-xs text-muted-foreground">Venta rapida sin cliente registrado.</p>
            </button>
            {clientes.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedClientId(client.id)}
                className={`rounded-lg border p-4 text-left transition-all ${selectedClientId === client.id ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/40"}`}
              >
                <p className="text-sm font-black text-foreground">{client.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{client.phone || "Sin telefono"}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeStep.id === "productos") {
      const projectedStock = selectedProduct ? selectedProduct.stock - quantity : null;
      return (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-black text-foreground">Repuestos de la venta</h3>
            <p className="text-xs text-muted-foreground">Selecciona piezas, revisa stock y arma el carrito.</p>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Repuesto</label>
                <button
                  type="button"
                  onClick={() => setProductPickerOpen(true)}
                  className="flex w-full items-center justify-between gap-3 rounded bg-input border border-border px-3 py-2 text-left text-xs text-foreground transition-all hover:border-primary focus:outline-none focus:border-primary"
                >
                  <span className={selectedProduct ? "font-bold text-foreground" : "text-muted-foreground"}>
                    {selectedProduct ? `[${selectedProduct.oem}] ${selectedProduct.name}` : "Abrir catalogo visual de repuestos"}
                  </span>
                  <Search className="h-4 w-4 text-primary" />
                </button>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cantidad</label>
                <QuantityPicker
                  value={quantity}
                  max={selectedProduct?.stock || 1}
                  disabled={!selectedProduct}
                  onChange={setSafeQuantity}
                />
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={!selectedProduct || quantity <= 0 || quantity > (selectedProduct?.stock || 0)}
                className="rounded bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
              >
                Agregar
              </button>
            </div>

            {selectedProduct ? (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{selectedProduct.name}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">OEM {selectedProduct.oem}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="rounded border border-border bg-background/70 px-2 py-1 text-muted-foreground">Precio {formatMoney(selectedProduct.price)}</span>
                      <span className="rounded border border-border bg-background/70 px-2 py-1 text-muted-foreground">Stock {formatNumber(selectedProduct.stock)}</span>
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">Quedarian {formatNumber(Math.max(0, projectedStock ?? selectedProduct.stock))}</span>
                    </div>
                  </div>
                  <p className="text-right text-xl font-black text-primary">{formatMoney(selectedProduct.price * Math.max(0, quantity))}</p>
                </div>
              </div>
            ) : null}
          </div>

          <CartTable cart={cart} products={products} onRemove={(id) => setCart(cart.filter((item) => item.productId !== id))} />
        </div>
      );
    }

    if (activeStep.id === "pago") {
      return (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-black text-foreground">Pago y comprobante</h3>
            <p className="text-xs text-muted-foreground">Define metodo de pago, descuento y datos de factura.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setMetodoPago(method)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  metodoPago === method ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {metodoPago === method ? <CheckCircle2 className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                {method}
              </button>
            ))}
          </div>

          <div className="grid gap-4 rounded-lg border border-border bg-background/40 p-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descuento</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={descuento || ""}
                onChange={(e) => setDescuento(Math.max(0, Number(e.target.value)))}
                className="w-full rounded bg-input border border-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Factura / recibo</label>
              <input
                value={nroFactura}
                onChange={(e) => setNroFactura(e.target.value)}
                className="w-full rounded bg-input border border-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                placeholder="Nro."
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full resize-none rounded bg-input border border-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                placeholder="Notas de la venta"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-black text-foreground">Revision final</h3>
          <p className="text-xs text-muted-foreground">Verifica cliente, carrito y total antes de procesar.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ReviewBox label="Cliente" value={selectedClient?.name || "Cliente General"} />
          <ReviewBox label="Metodo" value={metodoPago} />
          <ReviewBox label="Vendedor" value={username} />
        </div>
        <CartTable cart={cart} products={products} onRemove={(id) => setCart(cart.filter((item) => item.productId !== id))} />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 grid gap-2 md:grid-cols-4">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isDone = index < stepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setStepIndex(index)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  isActive ? "border-primary bg-primary/10" : isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-background/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Fase {index + 1}</span>
                  {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : null}
                </div>
                <p className="mt-1 text-sm font-black text-foreground">{step.label}</p>
                <p className="text-[11px] text-muted-foreground">{step.hint}</p>
              </button>
            );
          })}
        </div>

        {renderStep()}

        <div className="mt-6 flex justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            disabled={stepIndex === 0}
            className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Atras
          </button>
          {activeStep.id === "revision" ? (
            <button
              type="button"
              onClick={processSale}
              disabled={cart.length === 0}
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              Procesar Venta
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex(Math.min(steps.length - 1, stepIndex + 1))}
              disabled={!canContinue}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-card p-5 h-fit space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Resumen</h4>
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <SummaryLine label="Cliente" value={selectedClient?.name || "Cliente General"} />
        <SummaryLine label="Vendedor" value={username} />
        <SummaryLine label="Metodo" value={metodoPago} />
        <SummaryLine label="Lineas" value={formatNumber(cart.length)} />
        <SummaryLine label="Piezas" value={formatNumber(unitCount)} />
        <div className="space-y-2 border-t border-border pt-3">
          <SummaryLine label="Subtotal" value={formatMoney(subtotal)} strong />
          {descuento > 0 ? <SummaryLine label="Descuento" value={`- ${formatMoney(descuento)}`} /> : null}
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total a cobrar</p>
            <p className="text-3xl font-black text-primary">{formatMoney(total)}</p>
          </div>
        </div>
      </aside>

      {productPickerOpen ? (
        <ProductPickerModal
          products={filteredProducts}
          selectedProductId={selectedProductId}
          search={productSearch}
          onSearch={setProductSearch}
          onClose={() => setProductPickerOpen(false)}
          onSelect={(product) => {
            setSelectedProductId(product.id);
            setProductPickerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
};

const SummaryLine = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className={strong ? "font-black text-foreground" : "font-bold text-foreground"}>{value}</span>
  </div>
);

const QuantityPicker = ({
  value,
  max,
  disabled = false,
  onChange,
}: {
  value: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) => {
  const safeMax = Math.max(1, max);
  const quickValues = [1, 2, 4, 8].filter((amount) => amount <= safeMax);

  return (
    <div className={`space-y-2 ${disabled ? "opacity-50" : ""}`}>
      <div className="grid grid-cols-[36px_1fr_36px] overflow-hidden rounded border border-border bg-input">
        <button
          type="button"
          disabled={disabled || value <= 1}
          onClick={() => onChange(value - 1)}
          className="flex h-10 items-center justify-center border-r border-border text-muted-foreground transition-all hover:bg-muted/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={1}
          max={safeMax}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-10 w-full bg-transparent text-center text-sm font-black text-foreground outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={disabled || value >= safeMax}
          onClick={() => onChange(value + 1)}
          className="flex h-10 items-center justify-center border-l border-border text-muted-foreground transition-all hover:bg-muted/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quickValues.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={disabled}
            onClick={() => onChange(amount)}
            className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed ${
              value === amount
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            x{amount}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(safeMax)}
          className="rounded border border-border bg-background/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed"
        >
          Max {formatNumber(safeMax)}
        </button>
      </div>
    </div>
  );
};

const ReviewBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-background/40 p-4">
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-black text-foreground">{value}</p>
  </div>
);

const ProductPickerModal = ({
  products,
  selectedProductId,
  search,
  onSearch,
  onClose,
  onSelect,
}: {
  products: Product[];
  selectedProductId: string;
  search: string;
  onSearch: (value: string) => void;
  onClose: () => void;
  onSelect: (product: Product) => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
    <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-foreground">Catalogo visual de repuestos</h3>
          <p className="text-xs text-muted-foreground">Busca por nombre, OEM, marca, compatibilidad o ubicacion.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="self-end rounded-lg border border-border bg-background/40 p-2 text-muted-foreground transition-all hover:text-foreground md:self-auto"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Ej. filtro Hilux, FR7KPP33U+, Bosch, Corolla..."
            className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-3 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary"
            autoFocus
          />
        </div>
      </div>

      <div className="overflow-y-auto p-4">
        {products.length === 0 ? (
          <div className="rounded-lg border border-border bg-background/40 p-10 text-center text-sm text-muted-foreground">
            No se encontraron repuestos con esa busqueda.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const isSelected = selectedProductId === product.id;
              const isLow = product.stock > 0 && product.stock <= product.minStock;
              const isOut = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isOut}
                  onClick={() => onSelect(product)}
                  className={`group overflow-hidden rounded-lg border text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                      : "border-border bg-background/40 hover:border-primary/50 hover:bg-muted/20"
                  }`}
                >
                  <div className="aspect-[4/3] bg-background/70">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 text-primary/70" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="line-clamp-2 text-sm font-black text-foreground">{product.name}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">{product.oem}</p>
                      </div>
                      {isSelected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                      <span className="rounded border border-border bg-card px-2 py-1 text-muted-foreground">
                        {product.brand || "Sin marca"}
                      </span>
                      <span className={isOut ? "rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400" : isLow ? "rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-yellow-400" : "rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300"}>
                        Stock {formatNumber(product.stock)}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-2 border-t border-border/60 pt-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ubicacion</p>
                        <p className="text-xs font-bold text-foreground">{product.location || "Sin ubicacion"}</p>
                      </div>
                      <p className="text-sm font-black text-primary">{formatMoney(product.price)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
);

const CartTable = ({
  cart,
  products,
  onRemove,
}: {
  cart: any[];
  products: Product[];
  onRemove: (id: string) => void;
}) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full text-left">
      <thead className="bg-background/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <tr>
          <th className="p-3">Repuesto</th>
          <th className="p-3 text-right">Cant</th>
          <th className="p-3 text-right">Precio</th>
          <th className="p-3 text-right">Subtotal</th>
          <th className="p-3 text-right">Accion</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50 text-xs">
        {cart.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-8 text-center text-muted-foreground">
              Carrito vacio.
            </td>
          </tr>
        ) : (
          cart.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const remaining = product ? product.stock - item.quantity : 0;
            const critical = product ? remaining <= product.minStock : false;
            return (
              <tr key={item.productId} className="hover:bg-muted/10">
                <td className="p-3">
                  <p className="font-mono text-[10px] text-muted-foreground">[{item.oem}]</p>
                  <p className="font-bold text-foreground">{item.name}</p>
                  {critical ? <p className="mt-1 text-[10px] font-bold uppercase text-yellow-400">Stock critico tras venta</p> : null}
                </td>
                <td className="p-3 text-right font-bold">{formatNumber(item.quantity)}</td>
                <td className="p-3 text-right">{formatMoney(item.priceUnit)}</td>
                <td className="p-3 text-right font-black text-primary">{formatMoney(item.quantity * item.priceUnit)}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(item.productId)}
                    className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
