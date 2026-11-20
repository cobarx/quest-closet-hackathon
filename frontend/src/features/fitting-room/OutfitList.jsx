import { ArrowLeftRight, X } from "lucide-react";
import { CATEGORY_LABELS, SLOT_ORDER, fitsProfile, sizeLabel } from "./api";

const OutfitItem = ({ item, worn, replaces, profile, onOpen, onToggle, onRemove }) => (
  <div className={`fr-rise relative flex w-60 shrink-0 flex-col rounded-none border bg-[#ffffff] p-2.5 transition-colors ${worn ? "border-[#000000]" : "border-[#8f8f8f] opacity-75 hover:opacity-100"}`} data-testid={`outfit-item-${item.id}`}>
    <button onClick={() => onOpen(item)} className="flex gap-2.5 text-left" data-testid={`outfit-item-open-${item.id}`}>
      <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-none object-cover" />
      <span className="min-w-0 pr-4">
        <span className="block truncate text-sm text-[#000000]">{item.name}</span>
        <span className="block text-[10px] uppercase tracking-wider text-[#666666]">{CATEGORY_LABELS[item.category]} · {sizeLabel(item.sizing)}{item.sizing?.one_of_a_kind ? " · One-off" : ""}</span>
        <span className="block truncate text-[11px] text-[#666666]">{item.seller}</span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="font-mono text-sm text-[#000000]" data-testid={`outfit-item-price-${item.id}`}>${item.price}</span>
          {fitsProfile(item, profile) === false && <span className="text-[10px] text-[#d0021b]">May not fit</span>}
        </span>
      </span>
    </button>
    <button onClick={() => onRemove(item)} className="absolute right-1.5 top-1.5 rounded-none p-1 text-[#666666] transition-colors hover:text-[#d0021b]" aria-label="Remove from selection" data-testid={`outfit-item-remove-${item.id}`}>
      <X className="h-3.5 w-3.5" />
    </button>
    {replaces && <span className="mt-2 truncate text-[10px] text-[#666666]" data-testid={`outfit-item-replaces-${item.id}`}>Replaces {replaces.name}</span>}
    <button onClick={() => onToggle(item)} className={`mt-2.5 flex h-8 items-center justify-center gap-1.5 rounded-none text-xs transition-colors ${worn ? "border border-[#8f8f8f] text-[#000000] hover:border-[#000000] hover:text-[#555555]" : "bg-[#000000] text-white hover:bg-[#333333]"}`} data-testid={`outfit-item-toggle-${item.id}`}>
      {worn ? "Take off" : <><ArrowLeftRight className="h-3.5 w-3.5" />{replaces ? "Swap in" : "Put on"}</>}
    </button>
  </div>
);

export const OutfitList = ({ equipped, bench, profile, onOpen, onToggle, onRemove }) => {
  const worn = SLOT_ORDER.map((s) => equipped[s]).filter(Boolean);
  const aside = Object.values(bench);
  if (!worn.length && !aside.length) return null;
  const total = worn.reduce((sum, i) => sum + i.price, 0);
  const card = (item, isWorn) => (
    <OutfitItem key={item.id} item={item} worn={isWorn} replaces={!isWorn ? equipped[item.category] : null} profile={profile} onOpen={onOpen} onToggle={onToggle} onRemove={onRemove} />
  );
  return (
    <div className="space-y-2" data-testid="outfit-list">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-[#555555]"><span className="text-[#000000]">Your selection</span> · {worn.length} worn{aside.length ? ` · ${aside.length} set aside` : ""}</span>
        <span className="text-[#555555]">Worn total <span className="font-mono text-[#000000]" data-testid="outfit-list-total">${total.toFixed(2)}</span></span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {worn.map((i) => card(i, true))}
        {aside.map((i) => card(i, false))}
      </div>
    </div>
  );
};
