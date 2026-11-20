import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { useStore } from "./StoreContext";
import { money } from "./catalog";

const CartLine = ({ item, product, onChange, onRemove }) => {
  const sizes = product.sizing?.sizes || [];
  return (
    <li className="flex gap-3 border-b border-[#8f8f8f] py-4" data-testid={`bag-item-${item.product_id}`}>
      <img src={product.image} alt={product.name} className="h-24 w-20 shrink-0 object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold uppercase">{product.name}</p>
          <button onClick={onRemove} aria-label="Remove" data-testid={`bag-item-remove-${item.product_id}`}><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-sm font-bold">{money(product.price * item.qty)}</p>
        <div className="mt-2 flex items-center gap-3">
          {sizes.length > 1 ? (
            <select value={item.size} onChange={(e) => onChange({ size: e.target.value })} data-testid={`bag-item-size-${item.product_id}`}
              className={`border px-2 py-1 text-xs font-bold uppercase ${item.size ? "border-black" : "border-[#d0021b] text-[#d0021b]"}`}>
              <option value="">Pick size</option>
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : <span className="text-xs uppercase text-[#555555]">{sizes[0] || "One size"}</span>}
          <div className="flex items-center border border-black">
            <button onClick={() => item.qty > 1 && onChange({ qty: item.qty - 1 })} className="px-2 py-1" aria-label="Less" data-testid={`bag-item-minus-${item.product_id}`}><Minus className="h-3 w-3" /></button>
            <span className="px-2 text-xs font-bold" data-testid={`bag-item-qty-${item.product_id}`}>{item.qty}</span>
            <button onClick={() => onChange({ qty: item.qty + 1 })} className="px-2 py-1" aria-label="More" data-testid={`bag-item-plus-${item.product_id}`}><Plus className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    </li>
  );
};

export const CartDrawer = () => {
  const { cart, byId, updateCart, cartOpen, setCartOpen, api } = useStore();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const lines = cart.filter((i) => byId[i.product_id]);
  const subtotal = lines.reduce((s, i) => s + byId[i.product_id].price * i.qty, 0);
  const missingSize = lines.some((i) => (byId[i.product_id].sizing?.sizes || []).length > 1 && !i.size);

  const change = (idx, patch) => updateCart(cart.map((it, i) => (i === idx ? { ...it, ...patch } : it))).catch(() => toast.error("Could not update your bag"));
  const remove = (idx) => updateCart(cart.filter((_, i) => i !== idx));

  const checkout = async () => {
    if (!isSignedIn) {
      setCartOpen(false);
      toast("Log in to check out. Your bag is saved.");
      return navigate("/sign-in");
    }
    setBusy(true);
    try {
      const { checkout_url } = await api("post", "/checkout", { origin_url: window.location.origin });
      window.location.href = checkout_url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Checkout failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="fr-root flex w-full flex-col rounded-none border-l border-black bg-white sm:max-w-md" data-testid="bag-drawer">
        <SheetHeader><SheetTitle className="text-left text-2xl font-extrabold uppercase">Bag ({lines.length})</SheetTitle></SheetHeader>
        {lines.length === 0 ? (
          <p className="mt-10 text-sm uppercase text-[#555555]" data-testid="bag-empty">Your bag is empty.</p>
        ) : (
          <ul className="-mx-1 mt-2 flex-1 overflow-y-auto px-1">
            {cart.map((it, idx) => byId[it.product_id] && (
              <CartLine key={`${it.product_id}-${it.size}`} item={it} product={byId[it.product_id]} onChange={(p) => change(idx, p)} onRemove={() => remove(idx)} />
            ))}
          </ul>
        )}
        <div className="border-t border-black pt-4">
          <div className="flex justify-between text-sm font-bold uppercase"><span>Subtotal</span><span data-testid="bag-subtotal">{money(subtotal)}</span></div>
          <p className="mt-1 text-[11px] uppercase text-[#555555]">Tax and shipping calculated at checkout</p>
          {missingSize && <p className="mt-2 text-xs font-bold uppercase text-[#d0021b]" data-testid="bag-missing-size">Pick a size for every item</p>}
          <button onClick={checkout} disabled={!lines.length || missingSize || busy} className="fr-btn-primary mt-4 w-full" data-testid="bag-checkout-button">
            {busy ? "Opening checkout…" : isSignedIn ? "Checkout" : "Log in to checkout"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
