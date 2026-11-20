import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { RARITY_COLORS, sizeLabel } from "../features/fitting-room/api";
import { useStore } from "./StoreContext";
import { money } from "./catalog";
import { useI18n } from "../i18n";

export const ProductCard = ({ product }) => {
  const { addToCart } = useStore();
  const navigate = useNavigate();
  const { t, pn, term, sz } = useI18n();
  const sizes = product.sizing?.sizes || [];
  const quickAdd = () => {
    if (sizes.length > 1) return navigate(`/product/${product.id}`);
    addToCart([{ product_id: product.id, size: sizes[0] || "" }]).catch(() => toast.error(t("product.addFailed")));
  };
  return (
    <article className="fr-tile group relative" data-testid={`product-card-${product.id}`}>
      <Link to={`/product/${product.id}`} className="block" data-testid={`product-card-link-${product.id}`}>
        <div className="aspect-[4/5] overflow-hidden bg-[#f2f2f2]">
          <img src={product.image} alt={pn(product)} loading="lazy" className="fr-tile-img h-full w-full object-cover" />
        </div>
        <div className="px-1 py-2.5">
          {product.sizing?.one_of_a_kind && <p className="text-[10px] font-bold uppercase text-[#555555]">{t("product.oneOfAKind")}</p>}
          <p className="truncate text-[13px] font-bold uppercase">{pn(product)}</p>
          <p className="mt-0.5 text-[13px] font-bold" data-testid={`product-card-price-${product.id}`}>{money(product.price)}</p>
          <p className="mt-0.5 truncate text-[11px] uppercase text-[#666666]">{sz(sizeLabel(product.sizing)) || t("product.oneSize")} · {product.seller}</p>
        </div>
      </Link>
      <span className="absolute left-2 top-2 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: RARITY_COLORS[product.rarity] }}>{term("rarity", product.rarity)}</span>
      <button onClick={quickAdd} aria-label={t("product.addToBag")} data-testid={`product-card-add-${product.id}`}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center bg-white transition-colors hover:bg-black hover:text-white">
        <Plus className="h-4 w-4" />
      </button>
    </article>
  );
};

export const ProductGrid = ({ products, testId = "product-grid" }) => (
  <div className="grid grid-cols-2 gap-x-1 gap-y-5 md:grid-cols-3 lg:grid-cols-4" data-testid={testId}>
    {products.map((p) => <ProductCard key={p.id} product={p} />)}
  </div>
);
