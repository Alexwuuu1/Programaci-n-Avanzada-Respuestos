import React, { useEffect, useState } from "react";
import type { Product } from "../products/types";
import type { Compra, Proveedor } from "./types";
import { toast } from "../../components/ui/Toast";
import {
  cambiarEstadoCompra,
  createCompra,
  createProveedor,
  deleteProveedor,
  getCompras,
  getProveedores,
  updateProveedor,
} from "./api";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderMinus,
  Grid2X2,
  Info,
  Loader2,
  Package,
  Plus,
  PlusCircle,
  Search,
  ShoppingBag,
  Star,
  Table2,
  Trash2,
  Truck,
  User,
  X,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { exportarAExcel } from "../../utils/exportUtils";
import { imprimirReporteA4 } from "../finances/utils/printUtils";
import { formatMoney, formatNumber } from "../../lib/formatters";

interface PurchasesFeatureProps {
  products: Product[];
  username: string;
  onRefreshProducts: () => void;
}

type TabType = "suppliers" | "purchases";
type PurchaseStep = "supplier" | "items" | "costs" | "review";

const purchaseSteps: Array<{ id: PurchaseStep; label: string; hint: string }> = [
  { id: "supplier", label: "Proveedor", hint: "Datos del pedido" },
  { id: "items", label: "Repuestos", hint: "Armar carrito" },
  { id: "costs", label: "Costos", hint: "Revisar importes" },
  { id: "review", label: "Confirmar", hint: "Crear pedido" },
];

const InputClass = "w-full rounded border border-border bg-muted/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold";

export const PurchasesFeature: React.FC<PurchasesFeatureProps> = ({ products, username, onRefreshProducts }) => {
  const [activeTab, setActiveTab] = useState<TabType>("purchases");
  const [suppliers, setSuppliers] = useState<Proveedor[]>([]);
  const [purchases, setPurchases] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<Proveedor | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supName, setSupName] = useState("");
  const [supNit, setSupNit] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supSecondaryPhone, setSupSecondaryPhone] = useState("");
  const [supMainContact, setSupMainContact] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supPaymentTerms, setSupPaymentTerms] = useState("");
  const [supRating, setSupRating] = useState("");
  const [supNotes, setSupNotes] = useState("");
  const [supStatus, setSupStatus] = useState("Activo");

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStepIndex, setPurchaseStepIndex] = useState(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [cartItems, setCartItems] = useState<Array<{ productId: string; quantity: number; pricePurchase: number }>>([]);
  const [newItemProductId, setNewItemProductId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState("");
  const [nroReferencia, setNroReferencia] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sData, pData] = await Promise.all([getProveedores(), getCompras()]);
      setSuppliers(sData);
      setPurchases(pData);
    } catch (e: any) {
      setError(e.message || "Error al cargar la informacion de compras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && suppliers.length > 0 && products.length > 0) {
      const saved = localStorage.getItem("autoPurchaseData");
      if (saved) {
        try {
          const autoData = JSON.parse(saved);
          if (autoData.providerId) {
            const provExists = suppliers.some((s) => s.id === autoData.providerId);
            if (provExists) {
              setSelectedSupplierId(autoData.providerId);
              
              const initialCart = autoData.items.map((item: any) => {
                const prod = products.find((p) => String(p.id) === String(item.productId));
                const pricePurchase = prod ? Number(prod.costPrice || prod.price || 0) : 0;
                return {
                  productId: String(item.productId),
                  quantity: Number(item.quantity),
                  pricePurchase,
                };
              });

              setCartItems(initialCart);
              
              setNewItemProductId(products[0]?.id || "");
              setNewItemQty(1);
              setNewItemPrice(products[0]?.costPrice || products[0]?.price || 0);
              
              setFechaEntregaEstimada("");
              setNroReferencia("");
              setPurchaseNotes("");

              setPurchaseStepIndex(1);
              setShowPurchaseModal(true);
            }
          }
        } catch (e) {
          console.error("Error al procesar autoPurchaseData:", e);
        } finally {
          localStorage.removeItem("autoPurchaseData");
        }
      }
    }
  }, [loading, suppliers, products]);

  const resetSupplierForm = () => {
    setSupName("");
    setSupNit("");
    setSupEmail("");
    setSupPhone("");
    setSupSecondaryPhone("");
    setSupMainContact("");
    setSupAddress("");
    setSupPaymentTerms("");
    setSupRating("");
    setSupNotes("");
    setSupStatus("Activo");
  };

  const openNewSupplier = () => {
    setEditingSupplier(null);
    resetSupplierForm();
    setShowSupplierModal(true);
  };

  const openEditSupplier = (supplier: Proveedor) => {
    setEditingSupplier(supplier);
    setSupName(supplier.name);
    setSupNit(supplier.nit || "");
    setSupEmail(supplier.email || "");
    setSupPhone(supplier.phone);
    setSupSecondaryPhone(supplier.secondaryPhone || "");
    setSupMainContact(supplier.mainContact || "");
    setSupAddress(supplier.address || "");
    setSupPaymentTerms(supplier.paymentTerms || "");
    setSupRating(supplier.rating?.toString() || "");
    setSupNotes(supplier.notes || "");
    setSupStatus(supplier.status || "Activo");
    setShowSupplierModal(true);
  };

  const supplierPayload = (): Omit<Proveedor, "id" | "createdAt"> => ({
    name: supName.trim(),
    nit: supNit.trim() || "",
    email: supEmail.trim() || "",
    phone: supPhone.trim(),
    secondaryPhone: supSecondaryPhone.trim() || "",
    mainContact: supMainContact.trim() || "",
    address: supAddress.trim() || "",
    paymentTerms: supPaymentTerms.trim() || "",
    rating: supRating ? Number(supRating) : null,
    notes: supNotes.trim() || "",
    status: supStatus,
  });

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) {
      toast.warning("Nombre y teléfono son requeridos.");
      return;
    }

    try {
      setActionLoading(true);
      if (editingSupplier) {
        const updated = await updateProveedor(editingSupplier.id, supplierPayload());
        setSuppliers(suppliers.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("¡Proveedor actualizado!");
      } else {
        const created = await createProveedor(supplierPayload());
        setSuppliers([created, ...suppliers]);
        toast.success("¡Proveedor registrado!");
      }
      setShowSupplierModal(false);
    } catch (e: any) {
      toast.error(e.message || "Error al guardar el proveedor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este proveedor?")) return;
    try {
      setActionLoading(true);
      await deleteProveedor(id);
      setSuppliers(suppliers.filter((s) => s.id !== id));
      toast.success("¡Proveedor eliminado!");
    } catch (e: any) {
      toast.error(e.message || "No se pudo eliminar el proveedor.");
    } finally {
      setActionLoading(false);
    }
  };

  const openNewPurchase = () => {
    if (suppliers.length === 0) {
      toast.warning("Primero debes registrar al menos un proveedor.");
      setActiveTab("suppliers");
      return;
    }
    setSelectedSupplierId(suppliers[0].id);
    setCartItems([]);
    setNewItemProductId(products[0]?.id || "");
    setNewItemQty(1);
    setNewItemPrice(products[0]?.costPrice || products[0]?.price || 0);
    setFechaEntregaEstimada("");
    setNroReferencia("");
    setPurchaseNotes("");
    setPurchaseStepIndex(0);
    setShowPurchaseModal(true);
  };

  const addToCart = () => {
    if (!newItemProductId) return;
    const prod = products.find((p) => String(p.id) === newItemProductId);
    if (!prod) return;

    const pricePurchase = newItemPrice > 0 ? newItemPrice : Number(prod.costPrice || prod.price);
    const existing = cartItems.findIndex((i) => i.productId === newItemProductId);
    if (existing > -1) {
      const updated = [...cartItems];
      updated[existing].quantity += newItemQty;
      updated[existing].pricePurchase = pricePurchase;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { productId: newItemProductId, quantity: newItemQty, pricePurchase }]);
    }
    setNewItemQty(1);
  };

  const handleProcessPurchase = async () => {
    for (const step of purchaseSteps) {
      if (!validatePurchaseStep(step.id)) {
        setPurchaseStepIndex(purchaseSteps.findIndex((item) => item.id === step.id));
        return;
      }
    }

    try {
      setActionLoading(true);
      const created = await createCompra(selectedSupplierId, cartItems, username, {
        fechaEntregaEstimada: fechaEntregaEstimada || undefined,
        nroReferencia: nroReferencia.trim() || undefined,
        observaciones: purchaseNotes.trim() || undefined,
      });
      setPurchases([created, ...purchases]);
      setShowPurchaseModal(false);
      toast.success("¡Pedido de compra registrado!");
    } catch (e: any) {
      toast.error(e.message || "Error al registrar la compra.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceivePurchase = async (id: string) => {
    if (!confirm("¿Confirma que ha recibido fisicamente la mercaderia? Esto sumara el stock de inmediato.")) return;
    try {
      setActionLoading(true);
      const res = await cambiarEstadoCompra(id, "Recibido", username);
      toast.success(res.message || "¡Compra recibida e ingresada!");
      setPurchases(purchases.map((p) => (p.id === id ? { ...p, status: "Recibido", fechaRecepcion: new Date().toISOString() } : p)));
      onRefreshProducts();
    } catch (e: any) {
      toast.error(e.message || "Error al completar la compra.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPurchase = async (id: string) => {
    if (!confirm("¿Está seguro de cancelar este pedido a proveedor?")) return;
    try {
      setActionLoading(true);
      const res = await cambiarEstadoCompra(id, "Cancelado", username);
      toast.success(res.message || "Pedido cancelado.");
      setPurchases(purchases.map((p) => (p.id === id ? { ...p, status: "Cancelado" } : p)));
    } catch (e: any) {
      toast.error(e.message || "Error al cancelar la compra.");
    } finally {
      setActionLoading(false);
    }
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.quantity * item.pricePurchase, 0);
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const activePurchaseStep = purchaseSteps[purchaseStepIndex];

  const validatePurchaseStep = (stepId = activePurchaseStep.id) => {
    if (stepId === "supplier" && !selectedSupplierId) {
      toast.warning("Selecciona un proveedor para continuar.");
      return false;
    }
    if (stepId === "items" && cartItems.length === 0) {
      toast.warning("Agrega al menos un repuesto al pedido.");
      return false;
    }
    if (stepId === "costs" && cartItems.some((item) => item.quantity <= 0 || item.pricePurchase < 0)) {
      toast.warning("Revisa cantidades y costos del pedido.");
      return false;
    }
    return true;
  };

  const goNextPurchaseStep = () => {
    if (!validatePurchaseStep()) return;
    setPurchaseStepIndex((current) => Math.min(purchaseSteps.length - 1, current + 1));
  };

  const updateCartItem = (productId: string, patch: Partial<{ quantity: number; pricePurchase: number }>) => {
    setCartItems((items) =>
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              ...(patch.quantity != null && { quantity: Math.max(1, patch.quantity) }),
              ...(patch.pricePurchase != null && { pricePurchase: Math.max(0, patch.pricePurchase) }),
            }
          : item
      )
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-5 sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion de Compras</h1>
          <p className="text-sm text-muted-foreground mt-1">Abastecimiento, proveedores y recepcion de repuestos en Kardex.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg border border-border self-start">
          <TabButton active={activeTab === "purchases"} onClick={() => setActiveTab("purchases")} icon={<ShoppingBag className="h-4 w-4" />} label="Compras" />
          <TabButton active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")} icon={<Truck className="h-4 w-4" />} label="Proveedores" />
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2"><Info className="h-4 w-4" /> {error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs uppercase tracking-wider">Cargando informacion...</span>
        </div>
      ) : activeTab === "suppliers" ? (
        <SuppliersView suppliers={suppliers} actionLoading={actionLoading} onNew={openNewSupplier} onEdit={openEditSupplier} onDelete={handleDeleteSupplier} />
      ) : (
        <PurchasesView purchases={purchases} actionLoading={actionLoading} onNew={openNewPurchase} onReceive={handleReceivePurchase} onCancel={handleCancelPurchase} />
      )}

      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold uppercase tracking-wider text-foreground mb-4 border-b border-border pb-2">{editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Razon Social / Nombre"><input value={supName} onChange={(e) => setSupName(e.target.value)} className={InputClass} required /></Field>
                <Field label="NIT / RUC"><input value={supNit} onChange={(e) => setSupNit(e.target.value)} className={InputClass} /></Field>
                <Field label="Telefono"><input value={supPhone} onChange={(e) => setSupPhone(e.target.value)} className={InputClass} required /></Field>
                <Field label="Telefono Secundario"><input value={supSecondaryPhone} onChange={(e) => setSupSecondaryPhone(e.target.value)} className={InputClass} /></Field>
                <Field label="Email"><input type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} className={InputClass} /></Field>
                <Field label="Contacto Principal"><input value={supMainContact} onChange={(e) => setSupMainContact(e.target.value)} className={InputClass} /></Field>
                <Field label="Condiciones de Pago"><input value={supPaymentTerms} onChange={(e) => setSupPaymentTerms(e.target.value)} className={InputClass} placeholder="Contado, 30 dias, anticipo" /></Field>
                <Field label="Calificacion"><input type="number" min={1} max={5} value={supRating} onChange={(e) => setSupRating(e.target.value)} className={InputClass} /></Field>
                <Field label="Estado"><select value={supStatus} onChange={(e) => setSupStatus(e.target.value)} className={InputClass}><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></Field>
              </div>
              <Field label="Direccion"><textarea value={supAddress} onChange={(e) => setSupAddress(e.target.value)} rows={2} className={InputClass} /></Field>
              <Field label="Notas"><textarea value={supNotes} onChange={(e) => setSupNotes(e.target.value)} rows={2} className={InputClass} /></Field>
              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-6">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all">Cancelar</button>
                <button type="submit" disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-bold uppercase tracking-wider transition-all">
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="grid w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-extrabold uppercase tracking-wider text-foreground">Registrar Pedido de Compra</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Crea una orden pendiente; el stock sube recien cuando marcas el pedido como recibido.</p>
                </div>
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="rounded border border-border p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                {purchaseSteps.map((step, index) => {
                  const active = index === purchaseStepIndex;
                  const done = index < purchaseStepIndex;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (index <= purchaseStepIndex || validatePurchaseStep()) setPurchaseStepIndex(index);
                      }}
                      className={`rounded-lg border p-3 text-left transition-all ${active ? "border-primary bg-primary/10" : done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-background/30"}`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Fase {index + 1}</span>
                      <p className="mt-1 text-sm font-black text-foreground">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.hint}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-border bg-background/25 p-4">
                {activePurchaseStep.id === "supplier" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Proveedor">
                      <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className={InputClass}>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                      </select>
                    </Field>
                    <Field label="Entrega Estimada"><input type="date" value={fechaEntregaEstimada} onChange={(e) => setFechaEntregaEstimada(e.target.value)} className={InputClass} /></Field>
                    <Field label="Referencia"><input value={nroReferencia} onChange={(e) => setNroReferencia(e.target.value)} className={InputClass} placeholder="OC / factura proveedor" /></Field>
                    <div className="sm:col-span-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                      <strong className="block text-foreground">{selectedSupplier?.name || "Proveedor"}</strong>
                      Contacto: {selectedSupplier?.mainContact || "Sin contacto"} | Telefono: {selectedSupplier?.phone || "N/A"} | Pago: {selectedSupplier?.paymentTerms || "Sin condiciones"}
                    </div>
                  </div>
                )}

                {activePurchaseStep.id === "items" && (
                  <div className="space-y-4">
                    <div className="border border-border/50 rounded-lg p-3 bg-muted/20 space-y-3">
                      <span className="block text-[10px] uppercase tracking-wider text-primary font-extrabold">Agregar repuesto al pedido</span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-6">
                          <Field label="Repuesto">
                            <select value={newItemProductId} onChange={(e) => {
                              setNewItemProductId(e.target.value);
                              const prod = products.find((p) => String(p.id) === e.target.value);
                              setNewItemPrice(Number(prod?.costPrice || prod?.price || 0));
                            }} className={InputClass}>
                              {products.map((p) => <option key={p.id} value={p.id}>[{p.oem}] {p.name} (Stock: {p.stock})</option>)}
                            </select>
                          </Field>
                        </div>
                        <div className="sm:col-span-2"><Field label="Cantidad"><input type="number" min={1} value={newItemQty} onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))} className={InputClass} /></Field></div>
                        <div className="sm:col-span-2"><Field label="Costo Bs."><input type="number" min={0} step="0.01" value={newItemPrice} onChange={(e) => setNewItemPrice(Math.max(0, parseFloat(e.target.value) || 0))} className={InputClass} /></Field></div>
                        <div className="sm:col-span-2"><button type="button" onClick={addToCart} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-bold uppercase tracking-wider transition-all"><PlusCircle className="h-4 w-4" /> Agregar</button></div>
                      </div>
                    </div>
                    <CartTable cartItems={cartItems} products={products} onRemove={(productId) => setCartItems(cartItems.filter((i) => i.productId !== productId))} />
                  </div>
                )}

                {activePurchaseStep.id === "costs" && (
                  <div className="space-y-4">
                    <EditableCartTable cartItems={cartItems} products={products} onUpdate={updateCartItem} onRemove={(productId) => setCartItems(cartItems.filter((i) => i.productId !== productId))} />
                    <Field label="Observaciones"><textarea value={purchaseNotes} onChange={(e) => setPurchaseNotes(e.target.value)} rows={3} className={InputClass} placeholder="Notas del pedido, transporte o condiciones pactadas" /></Field>
                  </div>
                )}

                {activePurchaseStep.id === "review" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <ReviewBox label="Proveedor" value={selectedSupplier?.name || "Sin proveedor"} />
                      <ReviewBox label="Entrega" value={fechaEntregaEstimada ? new Date(fechaEntregaEstimada).toLocaleDateString("es-BO") : "Sin fecha"} />
                      <ReviewBox label="Referencia" value={nroReferencia || "Sin referencia"} />
                    </div>
                    <CartTable cartItems={cartItems} products={products} onRemove={(productId) => setCartItems(cartItems.filter((i) => i.productId !== productId))} />
                    {purchaseNotes && <div className="rounded border border-border bg-muted/20 p-3 text-xs text-muted-foreground">{purchaseNotes}</div>}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-border pt-4">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all">Cancelar</button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPurchaseStepIndex(Math.max(0, purchaseStepIndex - 1))} disabled={purchaseStepIndex === 0} className="flex items-center gap-1 px-4 py-2 border border-border rounded text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Atras</button>
                  {purchaseStepIndex < purchaseSteps.length - 1 ? (
                    <button type="button" onClick={goNextPurchaseStep} className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-bold uppercase tracking-wider transition-all">Siguiente <ChevronRight className="h-4 w-4" /></button>
                  ) : (
                    <button type="button" onClick={handleProcessPurchase} disabled={actionLoading || cartItems.length === 0} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50">
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Registrar Pedido
                    </button>
                  )}
                </div>
              </div>
            </div>

            <aside className="rounded-xl border border-border bg-background/30 p-5 h-fit space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Package className="h-5 w-5 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Resumen del pedido</h4>
              </div>
              <SummaryLine label="Proveedor" value={selectedSupplier?.name || "Sin proveedor"} />
              <SummaryLine label="Items" value={formatNumber(cartItems.length)} />
              <SummaryLine label="Piezas" value={formatNumber(cartItems.reduce((acc, item) => acc + item.quantity, 0))} />
              <SummaryLine label="Entrega" value={fechaEntregaEstimada ? new Date(fechaEntregaEstimada).toLocaleDateString("es-BO") : "Sin fecha"} />
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total pedido</p>
                <p className="text-2xl font-black text-primary">{formatMoney(cartTotal)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${active ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}>
    {icon} {label}
  </button>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</label>
    {children}
  </div>
);

const SummaryLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <strong className="text-right text-foreground">{value}</strong>
  </div>
);

const ReviewBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-background/40 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-black text-foreground">{value}</p>
  </div>
);

const SuppliersView: React.FC<{
  suppliers: Proveedor[];
  actionLoading: boolean;
  onNew: () => void;
  onEdit: (supplier: Proveedor) => void;
  onDelete: (id: string) => void;
}> = ({ suppliers, actionLoading, onNew, onEdit, onDelete }) => {
  const handleExportExcel = () => {
    exportarAExcel("Proveedores", [
      { header: "Proveedor", key: "name" },
      { header: "NIT / RUC", key: "nit" },
      { header: "Contacto Principal", key: "mainContact" },
      { header: "Teléfono", key: "phone" },
      { header: "Teléfono Secundario", key: "secondaryPhone" },
      { header: "Email", key: "email" },
      { header: "Dirección", key: "address" },
      { header: "Condiciones de Pago", key: "paymentTerms" },
      { header: "Calificación", key: "rating", transform: (val) => val != null ? `${val} Estrellas` : "N/A" },
      { header: "Estado", key: "status", transform: (val) => val || "Activo" }
    ], suppliers);
  };

  const handlePrintPDF = () => {
    const dataToPrint = suppliers.map(s => ({
      name: s.name,
      nit: s.nit || "N/A",
      contacto: s.mainContact || "N/A",
      telefono: s.phone,
      calificacion: s.rating != null ? `${s.rating} ★` : "N/A",
      estado: s.status || "Activo"
    }));

    imprimirReporteA4(
      "Reporte de Directorio de Proveedores",
      ["Proveedor / Razón Social", "NIT", "Contacto Principal", "Teléfono", "Calificación", "Estado"],
      ["name", "nit", "contacto", "telefono", "calificacion", "estado"],
      dataToPrint,
      `Total: ${suppliers.length} proveedores registrados.`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Directorio de Proveedores</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Exportar proveedores a Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Imprimir proveedores en PDF A4"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
          <button onClick={onNew} className="flex items-center gap-2 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg uppercase tracking-wider transition-all active:scale-[0.98]"><Plus className="h-4 w-4" /> Nuevo Proveedor</button>
        </div>
      </div>
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-left text-xs">
        <thead><tr className="border-b border-border bg-muted/50 uppercase tracking-wider font-semibold text-muted-foreground"><th className="p-4">Proveedor</th><th className="p-4">Contacto</th><th className="p-4">Pago / Rating</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead>
        <tbody className="divide-y divide-border">
          {suppliers.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest">Sin proveedores registrados</td></tr> : suppliers.map((s) => (
            <tr key={s.id} className={`hover:bg-muted/20 transition-all font-medium text-foreground ${s.status === "Inactivo" ? "opacity-60" : ""}`}>
              <td className="p-4"><div className="text-sm font-bold text-primary">{s.name}</div><div className="text-[10px] text-muted-foreground">NIT: {s.nit || "N/A"}</div><div className="text-[10px] text-muted-foreground">{s.address || "Sin direccion"}</div></td>
              <td className="p-4"><div>{s.mainContact || "Sin contacto"}</div><div className="text-muted-foreground">{s.phone}{s.secondaryPhone ? ` / ${s.secondaryPhone}` : ""}</div><div className="text-muted-foreground">{s.email || ""}</div></td>
              <td className="p-4"><div>{s.paymentTerms || "Sin condiciones"}</div><div className="flex items-center gap-1 text-yellow-400"><Star className="h-3 w-3" /> {s.rating ?? "N/A"}</div></td>
              <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${s.status === "Inactivo" ? "bg-muted border-border text-muted-foreground" : "bg-green-500/10 border-green-500/20 text-green-400"}`}>{s.status || "Activo"}</span></td>
              <td className="p-4 text-right space-x-2"><button onClick={() => onEdit(s)} disabled={actionLoading} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"><Edit3 className="h-4 w-4" /></button><button onClick={() => onDelete(s.id)} disabled={actionLoading} className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-4 w-4" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};

const PurchasesView: React.FC<{
  purchases: Compra[];
  actionLoading: boolean;
  onNew: () => void;
  onReceive: (id: string) => void;
  onCancel: (id: string) => void;
}> = ({ purchases, actionLoading, onNew, onReceive, onCancel }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [providerFilter, setProviderFilter] = useState("Todos");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const providers = Array.from(new Set(purchases.map((p) => p.providerName))).sort();
  const filteredPurchases = purchases.filter((purchase) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [
        purchase.id,
        purchase.providerName,
        purchase.buyerName,
        purchase.nroReferencia,
        purchase.observaciones,
        ...purchase.items.flatMap((item) => [item.productName, item.productOem]),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    return (
      matchesSearch &&
      (statusFilter === "Todos" || purchase.status === statusFilter) &&
      (providerFilter === "Todos" || purchase.providerName === providerFilter)
    );
  });
  const pendingCount = purchases.filter((p) => p.status === "Pendiente").length;
  const receivedCount = purchases.filter((p) => p.status === "Recibido").length;
  const canceledCount = purchases.filter((p) => p.status === "Cancelado").length;
  const totalPending = purchases.filter((p) => p.status === "Pendiente").reduce((sum, p) => sum + p.total, 0);
  const totalReceived = purchases.filter((p) => p.status === "Recibido").reduce((sum, p) => sum + p.total, 0);

  const handleExportExcel = () => {
    const mapped = filteredPurchases.map(c => ({
      ...c,
      formattedDate: new Date(c.date).toLocaleString("es-BO"),
      formattedEst: c.fechaEntregaEstimada ? new Date(c.fechaEntregaEstimada).toLocaleDateString("es-BO") : "N/A",
      formattedRec: c.fechaRecepcion ? new Date(c.fechaRecepcion).toLocaleString("es-BO") : "N/A"
    }));

    exportarAExcel("Pedidos_Compra", [
      { header: "ID Pedido", key: "id", transform: (val) => `#PD-${val}` },
      { header: "Proveedor", key: "providerName" },
      { header: "Fecha Pedido", key: "formattedDate" },
      { header: "Entrega Estimada", key: "formattedEst" },
      { header: "Recepción", key: "formattedRec" },
      { header: "Referencia", key: "nroReferencia" },
      { header: "Comprador", key: "buyerName" },
      { header: "Total (Bs.)", key: "total", transform: (val) => formatMoney(Number(val)) },
      { header: "Estado", key: "status" }
    ], mapped);
  };

  const handlePrintPDF = () => {
    const dataToPrint = filteredPurchases.map(c => ({
      id: `#PD-${c.id}`,
      proveedor: c.providerName,
      fecha: new Date(c.date).toLocaleDateString("es-BO"),
      referencia: c.nroReferencia || "N/A",
      total: formatMoney(c.total),
      estado: c.status
    }));

    imprimirReporteA4(
      "Reporte de Historial de Pedidos de Compra",
      ["ID Pedido", "Proveedor", "Fecha Pedido", "Referencia", "Total", "Estado"],
      ["id", "proveedor", "fecha", "referencia", "total", "estado"],
      dataToPrint,
      `Listado filtrado de ${filteredPurchases.length} de ${purchases.length} ordenes de abastecimiento.`
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Cabecera y acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Historial de Pedidos de Compra</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Exportar pedidos a Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            title="Imprimir pedidos en PDF A4"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
          <button onClick={onNew} className="flex items-center gap-2 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg uppercase tracking-wider transition-all active:scale-[0.98]"><Plus className="h-4 w-4" /> Registrar Compra</button>
        </div>
      </div>

      {/* Tarjetas de Métricas / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale animate-pulseNeon">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pendientes de Entrega</span>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Truck className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-yellow-500 mt-2">
            {pendingCount} <span className="text-xs font-normal text-muted-foreground">pedidos</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mt-2">
            Por recibir: {formatMoney(totalPending)}
          </p>
        </div>

        <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ingresados a Almacén</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            {receivedCount} <span className="text-xs font-normal text-muted-foreground">pedidos</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mt-2">
            Total en stock: {formatMoney(totalReceived)}
          </p>
        </div>

        <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pedidos Cancelados</span>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <X className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-400 mt-2">
            {canceledCount} <span className="text-xs font-normal text-muted-foreground">pedidos</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mt-2">
            Órdenes desestimadas
          </p>
        </div>

        <div className="bg-card/75 border border-border/80 rounded-xl p-5 hover-scale">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Histórico</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-primary mt-2">
            {purchases.length} <span className="text-xs font-normal text-muted-foreground">órdenes</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mt-2">
            Total operado: {formatMoney(purchases.reduce((acc, p) => acc + p.total, 0))}
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-card/75 border border-border/80 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por ID, OEM, repuesto, referencia, obs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
            />
          </div>

          <div className="w-full sm:w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Recibido">Recibidos</option>
              <option value="Cancelado">Cancelados</option>
            </select>
          </div>

          <div className="w-full sm:w-[200px]">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-semibold"
            >
              <option value="Todos">Todos los Proveedores</option>
              {providers.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex rounded border border-border bg-input p-1 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Vista tarjetas"
          >
            <Grid2X2 className="h-3.5 w-3.5" />
            Tarjetas
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Vista tabla"
          >
            <Table2 className="h-3.5 w-3.5" />
            Tabla
          </button>
        </div>
      </div>

      {/* Renderizado de Compras */}
      {filteredPurchases.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground uppercase tracking-widest text-xs">
          Sin pedidos de compra que coincidan con los filtros
        </div>
      ) : viewMode === "cards" ? (
        <div className="space-y-4">
          {filteredPurchases.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/30">
              <div className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="font-bold text-foreground text-sm">Pedido #{c.id}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Truck className="h-3.5 w-3.5 text-primary" /> {c.providerName}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {new Date(c.date).toLocaleDateString()}</span>
                  {c.fechaEntregaEstimada && <span className="text-yellow-400 font-semibold">Entrega: {new Date(c.fechaEntregaEstimada).toLocaleDateString()}</span>}
                  {c.nroReferencia && <span className="text-muted-foreground font-semibold">Ref: {c.nroReferencia}</span>}
                  <span className="flex items-center gap-1 text-muted-foreground"><User className="h-3.5 w-3.5" /> {c.buyerName}</span>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="font-extrabold text-sm text-foreground">{formatMoney(c.total)}</span>
                  <StatusBadge status={c.status} />
                  {c.status === "Pendiente" && (
                    <div className="flex gap-1.5 ml-2">
                      <button onClick={() => onReceive(c.id)} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded uppercase tracking-wider transition-all">
                        <Check className="h-3 w-3" /> Recibir
                      </button>
                      <button onClick={() => onCancel(c.id)} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-destructive/20 hover:bg-destructive/30 text-destructive text-[10px] font-bold rounded border border-destructive/30 uppercase tracking-wider transition-all">
                        <X className="h-3 w-3" /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {c.observaciones && <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/50">Obs: {c.observaciones}</div>}
              <div className="p-3 bg-card/50"><PurchaseItemsTable items={c.items} /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 uppercase tracking-wider font-semibold text-muted-foreground">
                <th className="p-4">ID Pedido</th>
                <th className="p-4">Proveedor</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Items / Unidades</th>
                <th className="p-4">Referencia</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPurchases.map((c) => {
                const totalItemsCount = c.items.length;
                const totalUnitsCount = c.items.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <tr key={c.id} className="hover:bg-muted/20 transition-all font-medium text-foreground">
                    <td className="p-4 font-mono font-bold">#PD-{c.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-primary">{c.providerName}</div>
                      <div className="text-[10px] text-muted-foreground">Comprador: {c.buyerName}</div>
                    </td>
                    <td className="p-4">
                      <div>{new Date(c.date).toLocaleDateString()}</div>
                      {c.fechaEntregaEstimada && (
                        <div className="text-[10px] text-yellow-400 font-semibold mt-0.5">
                          Est: {new Date(c.fechaEntregaEstimada).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div>{totalItemsCount} ref.</div>
                      <div className="text-[10px] text-muted-foreground">{totalUnitsCount} piezas</div>
                    </td>
                    <td className="p-4 font-mono">{c.nroReferencia || "N/A"}</td>
                    <td className="p-4 text-right font-bold text-foreground">{formatMoney(c.total)}</td>
                    <td className="p-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-4 text-right">
                      {c.status === "Pendiente" ? (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => onReceive(c.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded uppercase tracking-wider transition-all"
                            title="Confirmar recepción física"
                          >
                            <Check className="h-3 w-3" /> Recibir
                          </button>
                          <button
                            onClick={() => onCancel(c.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1 bg-destructive/20 hover:bg-destructive/30 text-destructive text-[10px] font-bold rounded border border-destructive/30 uppercase tracking-wider transition-all"
                            title="Cancelar pedido"
                          >
                            <X className="h-3 w-3" /> Cancelar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          {c.status === "Recibido" ? `Recibido el ${new Date(c.fechaRecepcion || "").toLocaleDateString()}` : "Cancelado"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${status === "Recibido" ? "bg-green-500/10 text-green-400 border border-green-500/20" : status === "Cancelado" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>{status}</span>
);

const PurchaseItemsTable: React.FC<{ items: Compra["items"] }> = ({ items }) => (
  <table className="w-full text-left text-[11px] text-muted-foreground border-collapse">
    <thead><tr className="border-b border-border/50 text-[10px] uppercase tracking-wider font-semibold"><th className="pb-2">OEM</th><th className="pb-2">Repuesto</th><th className="pb-2 text-right">Cant.</th><th className="pb-2 text-right">Costo Compra</th><th className="pb-2 text-right">Subtotal</th></tr></thead>
    <tbody className="divide-y divide-border/30">{items.map((item, idx) => <tr key={idx} className="hover:bg-muted/10"><td className="py-2 font-mono font-bold text-foreground">{item.productOem}</td><td className="py-2 text-foreground font-semibold">{item.productName}</td><td className="py-2 text-right text-foreground">{formatNumber(item.quantity)}</td><td className="py-2 text-right">{formatMoney(item.pricePurchase)}</td><td className="py-2 text-right font-bold text-foreground">{formatMoney(item.quantity * item.pricePurchase)}</td></tr>)}</tbody>
  </table>
);

const CartTable: React.FC<{ cartItems: Array<{ productId: string; quantity: number; pricePurchase: number }>; products: Product[]; onRemove: (productId: string) => void }> = ({ cartItems, products, onRemove }) => (
  <div className="rounded-lg border border-border overflow-hidden max-h-48 overflow-y-auto bg-card">
    <table className="w-full text-left text-xs border-collapse">
      <thead><tr className="border-b border-border bg-muted/50 uppercase tracking-wider text-[10px] font-semibold text-muted-foreground"><th className="p-3">OEM</th><th className="p-3">Repuesto</th><th className="p-3 text-right">Cant.</th><th className="p-3 text-right">Costo U.</th><th className="p-3 text-right">Subtotal</th><th className="p-3 text-right"></th></tr></thead>
      <tbody className="divide-y divide-border">{cartItems.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground font-mono">El carrito esta vacio</td></tr> : cartItems.map((item) => {
        const prod = products.find((p) => String(p.id) === item.productId);
        return <tr key={item.productId} className="hover:bg-muted/10 font-medium"><td className="p-3 font-mono font-bold text-foreground">{prod?.oem}</td><td className="p-3 text-foreground">{prod?.name}</td><td className="p-3 text-right">{formatNumber(item.quantity)}</td><td className="p-3 text-right">{formatMoney(item.pricePurchase)}</td><td className="p-3 text-right font-bold text-foreground">{formatMoney(item.quantity * item.pricePurchase)}</td><td className="p-3 text-right"><button type="button" onClick={() => onRemove(item.productId)} className="text-muted-foreground hover:text-destructive transition-all"><FolderMinus className="h-4 w-4" /></button></td></tr>;
      })}</tbody>
    </table>
  </div>
);

const EditableCartTable: React.FC<{
  cartItems: Array<{ productId: string; quantity: number; pricePurchase: number }>;
  products: Product[];
  onUpdate: (productId: string, patch: Partial<{ quantity: number; pricePurchase: number }>) => void;
  onRemove: (productId: string) => void;
}> = ({ cartItems, products, onUpdate, onRemove }) => (
  <div className="rounded-lg border border-border overflow-hidden bg-card">
    <table className="w-full text-left text-xs border-collapse">
      <thead>
        <tr className="border-b border-border bg-muted/50 uppercase tracking-wider text-[10px] font-semibold text-muted-foreground">
          <th className="p-3">Repuesto</th>
          <th className="p-3 text-right">Cantidad</th>
          <th className="p-3 text-right">Costo U.</th>
          <th className="p-3 text-right">Subtotal</th>
          <th className="p-3 text-right"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {cartItems.length === 0 ? (
          <tr><td colSpan={5} className="p-6 text-center text-muted-foreground font-mono">El carrito esta vacio</td></tr>
        ) : cartItems.map((item) => {
          const prod = products.find((p) => String(p.id) === item.productId);
          return (
            <tr key={item.productId} className="hover:bg-muted/10">
              <td className="p-3">
                <p className="font-mono text-[10px] text-primary">{prod?.oem}</p>
                <p className="font-bold text-foreground">{prod?.name}</p>
              </td>
              <td className="p-3 text-right">
                <input type="number" min={1} value={item.quantity} onChange={(e) => onUpdate(item.productId, { quantity: Number(e.target.value) || 1 })} className="ml-auto w-20 rounded border border-border bg-input px-2 py-1 text-right text-xs text-foreground outline-none focus:border-primary" />
              </td>
              <td className="p-3 text-right">
                <input type="number" min={0} step="0.01" value={item.pricePurchase} onChange={(e) => onUpdate(item.productId, { pricePurchase: Number(e.target.value) || 0 })} className="ml-auto w-24 rounded border border-border bg-input px-2 py-1 text-right text-xs text-foreground outline-none focus:border-primary" />
              </td>
              <td className="p-3 text-right font-bold text-foreground">{formatMoney(item.quantity * item.pricePurchase)}</td>
              <td className="p-3 text-right"><button type="button" onClick={() => onRemove(item.productId)} className="text-muted-foreground hover:text-destructive transition-all"><FolderMinus className="h-4 w-4" /></button></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
