import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/sheet";
import { CATEGORY_LABELS, RARITY_COLORS, fitsProfile, suggestedSize } from "./api";

const Spec = ({ label, value }) => (
  <div className="flex justify-between border-b border-[#8f8f8f] py-2.5 text-sm">
    <span className="text-[#666666]">{label}</span>
    <span className="text-right capitalize text-[#000000]">{value}</span>
  </div>
);

const SizingBlock = ({ s, fits, profile }) => {
  const mine = profile && suggestedSize(profile);
  return (
    <div className="mt-6 rounded-none border border-[#8f8f8f] bg-[#f2f2f2] p-4" data-testid="item-detail-sizing">
      <div className="mb-2 flex items-center justify-between">
        <span className="fr-eyebrow">Sizing</span>
        {s.one_of_a_kind && <span className="rounded-full border border-[#000000] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#000000]" data-testid="item-detail-one-off">One of a kind</span>}
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5" data-testid="item-detail-sizes">
        {s.sizes.map((z) => (
          <span key={z} className={`rounded-none border px-2 py-0.5 font-mono text-xs ${z === mine ? "border-[#000000] text-[#000000]" : "border-[#8f8f8f] text-[#000000]"}`}>{z}</span>
        ))}
      </div>
      {s.length_cm && <Spec label="Length" value={`${s.length_cm} cm`} />}
      <Spec label="Measurements" value={s.measurements} />
      <Spec label="Fits height" value={`${s.min_height_cm}-${s.max_height_cm} cm`} />
      <Spec label="Fits weight" value={`${s.min_weight_kg}-${s.max_weight_kg} kg`} />
      <Spec label="Adjustable" value={s.adjustable ? "Yes" : "No"} />
      {s.notes && <p className="mt-2 text-xs text-[#555555]">{s.notes}</p>}
      {fits !== null && (
        <p className={`mt-3 text-sm ${fits ? "text-[#0a7f3f]" : "text-[#d0021b]"}`} data-testid="item-detail-fit-status">
          {fits ? "Should fit you based on your measurements." : "May not fit your measurements."}
        </p>
      )}
    </div>
  );
};

export const ItemDrawer = ({ profile, item, onClose, isEquipped, onToggle, replacing }) => (
  <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
    <SheetContent className="w-full overflow-y-auto border-[#8f8f8f] bg-[#ffffff] text-[#000000] sm:max-w-md" data-testid="item-detail-drawer">
      {item && (
        <>
          <img src={item.image} alt={item.name} className="-mx-6 -mt-6 mb-6 aspect-square w-[calc(100%+3rem)] max-w-none object-cover" />
          <SheetHeader className="text-left">
            <span className="text-xs uppercase tracking-[0.2em]" style={{ color: RARITY_COLORS[item.rarity] }}>{item.rarity} · {CATEGORY_LABELS[item.category]}</span>
            <SheetTitle className="font-display text-2xl text-[#000000]" data-testid="item-detail-name">{item.name}</SheetTitle>
            <SheetDescription className="text-[#555555]">{item.description}</SheetDescription>
          </SheetHeader>
          <p className="mt-5 font-display text-3xl text-[#000000]" data-testid="item-detail-price">${item.price} <span className="font-sans text-xs text-[#666666]">{item.currency}</span></p>
          <div className="mt-5">
            <Spec label="Seller" value={item.seller} />
            <Spec label="Material" value={item.material} />
            <Spec label="Fit" value={item.gender} />
            <Spec label="Color" value={item.color} />
            <Spec label="Aesthetic" value={item.aesthetic} />
            <Spec label="Availability" value={item.in_stock ? "In stock" : "Sold out"} />
          </div>
          {item.sizing && <SizingBlock s={item.sizing} fits={fitsProfile(item, profile)} profile={profile} />}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((t) => <span key={t} className="rounded-full border border-[#8f8f8f] px-2.5 py-0.5 text-[11px] text-[#555555]">{t}</span>)}
          </div>
          {replacing && !isEquipped && <p className="mt-5 text-xs text-[#555555]" data-testid="item-detail-replace-note">Replaces your {replacing.name}.</p>}
          <button onClick={() => onToggle(item)} className={`${isEquipped ? "fr-btn-ghost" : "fr-btn-primary"} mt-3 w-full`} data-testid="item-detail-equip-toggle">
            {isEquipped ? "Take off" : "Equip to mirror"}
          </button>
        </>
      )}
    </SheetContent>
  </Sheet>
);
