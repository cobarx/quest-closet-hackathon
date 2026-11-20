import { X } from "lucide-react";
import { CATEGORY_LABELS, SLOT_ORDER } from "./api";

export const WardrobeTray = ({ equipped, onRemove, onClear, onOpen, onCheckout, styleNote, onClearNote }) => {
  const items = SLOT_ORDER.map((s) => equipped[s]).filter(Boolean);
  const total = items.reduce((sum, i) => sum + i.price, 0);
  return (
    <section className="fr-panel p-5" data-testid="equipped-wardrobe-tray">
      <div className="mb-4 flex items-center justify-between">
        <span className="fr-eyebrow">Equipped</span>
        {items.length > 0 && (
          <button onClick={onClear} className="text-xs text-[#555555] transition-colors hover:text-[#d0021b]" data-testid="clear-wardrobe-button">Clear all</button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#666666]" data-testid="wardrobe-empty">Nothing equipped yet. Pick gear from the armory or ask the Quartermaster.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-3 rounded-none border border-transparent p-1.5 transition-colors hover:border-[#8f8f8f] hover:bg-[#ffffff]" data-testid={`equipped-item-${item.id}`}>
              <button onClick={() => onOpen(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded-none object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-[#000000]">{item.name}</span>
                  <span className="block text-[11px] uppercase tracking-wider text-[#666666]">{CATEGORY_LABELS[item.category]}</span>
                </span>
              </button>
              <span className="font-mono text-sm text-[#000000]">${item.price}</span>
              <button onClick={() => onRemove(item)} className="rounded-none p-1 text-[#666666] transition-colors hover:text-[#d0021b]" data-testid={`unequip-${item.id}`} aria-label="Remove">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {styleNote && (
        <div className="mt-4 flex items-start gap-2 rounded-none border border-[#8f8f8f] bg-[#ffffff] p-2.5 text-xs text-[#555555]" data-testid="style-note">
          <span className="flex-1"><span className="text-[#000000]">Mood:</span> {styleNote}</span>
          <button onClick={onClearNote} className="hover:text-[#d0021b]" data-testid="style-note-clear" aria-label="Clear mood"><X className="h-3 w-3" /></button>
        </div>
      )}
      <div className="mt-5 flex items-end justify-between border-t border-[#8f8f8f] pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#666666]">Outfit total</p>
          <p className="font-display text-2xl text-[#000000]" data-testid="wardrobe-total-price">${total.toFixed(2)}</p>
        </div>
        <button onClick={() => onCheckout(items)} disabled={!items.length} className="fr-btn-ghost" data-testid="wardrobe-checkout-button">Add outfit to bag</button>
      </div>
    </section>
  );
};
