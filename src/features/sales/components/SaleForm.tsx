import React, { useState } from "react";
import type { Product } from "../../products/types";
import type { Cliente } from "../types";
import { ShoppingCart, Trash2, UserPlus } from "lucide-react";

interface SaleFormProps {
  products: Product[];
  clientes: Cliente[];
  username: string;
  onAddCliente: (c: { name: string; phone?: string; address?: string }) => Promise<void>;
  onSubmitSale: (saleData: { clientId?: string; items: any[] }) => void;
}

export const SaleForm: React.FC<SaleFormProps> = ({
  products,
  clientes,
  username,
  onAddCliente,
  onSubmitSale,
}) => {
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState("");
  
  // Nuevo cliente inline
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    if (quantity <= 0 || quantity > selectedProduct.stock) {
      alert(`Cantidad no válida. Stock disponible: ${selectedProduct.stock}`);
      return;
    }

    const existingItem = cart.find((i) => i.productId === selectedProduct.id);
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > selectedProduct.stock) {
        alert(`No puedes exceder el stock disponible de ${selectedProduct.stock} unidades.`);
        return;
      }
      setCart(cart.map((i) => (i.productId === selectedProduct.id ? { ...i, quantity: newQty } : i)));
    } else {
      setCart([...cart, {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        oem: selectedProduct.oem,
        quantity,
        priceUnit: selectedProduct.price,
      }]);
    }
    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveFromCart = (prodId: string) => {
    setCart(cart.filter((i) => i.productId !== prodId));
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

  const total = cart.reduce((sum, item) => sum + item.quantity * item.priceUnit, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Carrito e Ítems */}
      <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Carrito de Ventas</h3>
        </div>

        {/* Añadir al carro inline */}
        <div className="flex flex-col md:flex-row gap-3 items-end bg-background/50 p-4 rounded-lg border border-border">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Repuesto</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded bg-input border border-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">-- Seleccionar repuesto --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  [{p.oem}] {p.name} ({p.stock > 0 ? `Stock: ${p.stock}` : "AGOTADO"})
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              max={selectedProduct ? selectedProduct.stock : 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded bg-input border border-border px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!selectedProductId || selectedProduct!.stock <= 0}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            Añadir
          </button>
        </div>

        {/* Tabla items carro */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="pb-2">OEM / Repuesto</th>
                <th className="pb-2 text-right">Cant</th>
                <th className="pb-2 text-right">Precio</th>
                <th className="pb-2 text-right">Subtotal</th>
                <th className="pb-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {cart.map((item) => (
                <tr key={item.productId} className="hover:bg-muted/10">
                  <td className="py-2.5">
                    <span className="text-[10px] text-muted-foreground font-mono">[{item.oem}]</span>
                    <p className="font-semibold text-foreground">{item.name}</p>
                  </td>
                  <td className="py-2.5 text-right font-semibold">{item.quantity}</td>
                  <td className="py-2.5 text-right">Bs. {item.priceUnit}</td>
                  <td className="py-2.5 text-right font-bold text-foreground">Bs. {item.quantity * item.priceUnit}</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">Carro vacío. Selecciona repuestos arriba.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facturación y Resumen */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6 h-fit">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">Resumen de Venta</h4>
        
        {/* Cliente selector */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cliente / Taller</label>
            <button
              onClick={() => setShowAddClient(!showAddClient)}
              className="text-[10px] font-bold text-primary uppercase flex items-center gap-0.5 hover:text-accent"
            >
              <UserPlus className="h-3 w-3" /> Nuevo
            </button>
          </div>

          {showAddClient ? (
            <form onSubmit={handleSaveClient} className="p-3 border border-border rounded bg-background/30 space-y-2.5">
              <input
                type="text"
                placeholder="Nombre taller o cliente"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full rounded bg-input border border-border px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                required
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="w-full rounded bg-input border border-border px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-1 rounded text-[10px] font-bold uppercase hover:bg-accent"
              >
                Crear Cliente
              </button>
            </form>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full rounded bg-input border border-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">-- Cliente General --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Resumen Totales */}
        <div className="space-y-2.5 bg-background/50 p-4 rounded-lg border border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Vendedor:</span>
            <span className="font-bold text-foreground capitalize">{username}</span>
          </div>
          <div className="flex justify-between items-baseline border-t border-border/50 pt-2.5">
            <span className="text-sm font-bold text-foreground">Total:</span>
            <span className="text-2xl font-black text-primary">Bs. {total}</span>
          </div>
        </div>

        <button
          onClick={() => {
            onSubmitSale({ clientId: selectedClientId || undefined, items: cart });
            setCart([]);
            setSelectedClientId("");
          }}
          disabled={cart.length === 0}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          Procesar Venta
        </button>
      </div>
    </div>
  );
};
