import { Check, Plus } from "lucide-react";
import { RARITY_COLORS, fitsProfile, sizeLabel } from "./api";
import { useI18n } from "../../i18n";

const ItemCard = ({ profile, item, equipped, highlighted, onOpen, onToggle, index }) => {
  const { t, pn, term, sz } = useI18n();
  return (
  <article style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    className={`fr-card fr-rise group ${equipped ? "fr-card-equipped" : ""} ${highlighted ? "fr-card-highlight" : ""}`} data-testid={`catalog-item-card-${item.id}`}>
    <button onClick={() => onOpen(item)} className="block w-full text-left" data-testid={`catalog-item-open-${item.id}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f2f2f2]">
        <img src={item.image} alt={pn(item)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-2 top-2 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: RARITY_COLORS[item.rarity] }}>{term("rarity", item.rarity)}</span>
      </div>
      <div className="px-1 py-2.5">
        {item.sizing?.one_of_a_kind && <p className="text-[10px] font-bold uppercase text-[#555555]">{t("product.oneOfAKind")}</p>}
        <p className="truncate text-[13px] font-bold uppercase text-black">{pn(item)}</p>
        <p className="mt-0.5 text-[13px] font-bold text-black" data-testid={`catalog-item-price-${item.id}`}>${item.price.toFixed(2)}</p>
        {item.sizing && (
          <p className="mt-0.5 truncate text-[11px] uppercase text-[#666666]" data-testid={`catalog-item-size-${item.id}`}>
            {sizeLabel(item.sizing) === "One size" ? t("product.oneSize") : t("grid.size", { size: sz(sizeLabel(item.sizing)) })} · {item.seller}
          </p>
        )}
        {fitsProfile(item, profile) === false && <p className="mt-1 text-[10px] text-[#d0021b]" data-testid={`catalog-item-nofit-${item.id}`}>{t("grid.mayNotFit")}</p>}
      </div>
    </button>
    <button onClick={() => onToggle(item)} aria-label={equipped ? t("grid.unequip") : t("grid.equip")}
      className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center transition-colors ${equipped ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"}`}
      data-testid={`item-quick-equip-button-${item.id}`}>
      {equipped ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </button>
  </article>
  );
};

export const CatalogGrid = ({ profile, products, equipped, highlight, onOpen, onToggle, loading }) => {
  const { t } = useI18n();
  if (!loading && products.length === 0)
    return <p className="py-16 text-center text-sm text-[#666666]" data-testid="catalog-empty">{t("grid.empty")}</p>;
  return (
    <div className="grid grid-cols-2 gap-x-1 gap-y-4 sm:grid-cols-3" data-testid="catalog-grid">
      {products.map((item, i) => (
        <ItemCard profile={profile} key={item.id} index={i} item={item} equipped={equipped[item.category]?.id === item.id}
          highlighted={highlight.includes(item.id)} onOpen={onOpen} onToggle={onToggle} />
      ))}
    </div>
  );
};
