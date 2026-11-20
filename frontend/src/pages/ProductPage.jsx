import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useStore } from "../store/StoreContext";
import { byCategoryId, money } from "../store/catalog";
import { ProductGrid } from "../store/ProductCard";
import { RARITY_COLORS } from "../features/fitting-room/api";
import { useI18n } from "../i18n";

const Row = ({ label, value }) => value ? (
  <div className="flex justify-between gap-4 border-b border-[#8f8f8f] py-2 text-xs uppercase"><span className="text-[#555555]">{label}</span><span className="text-right font-bold">{value}</span></div>
) : null;

const SizingDetails = ({ s }) => {
  const { t, sz } = useI18n();
  return (
    <div className="mt-8" data-testid="product-sizing">
      <p className="mb-2 text-sm font-extrabold uppercase">{t("sizing.title")}</p>
      <Row label={t("sizing.sizes")} value={sz(s.sizes.join(" / "))} />
      <Row label={t("sizing.length")} value={s.length_cm ? `${s.length_cm} cm` : ""} />
      <Row label={t("sizing.measurements")} value={s.measurements} />
      <Row label={t("sizing.height")} value={`${s.min_height_cm}-${s.max_height_cm} cm`} />
      <Row label={t("sizing.weight")} value={`${s.min_weight_kg}-${s.max_weight_kg} kg`} />
      <Row label={t("sizing.adjustable")} value={s.adjustable ? t("common.yes") : t("common.no")} />
      {s.one_of_a_kind && <Row label={t("sizing.availability")} value={t("product.oneOfAKind")} />}
      {s.notes && <p className="mt-2 text-xs text-[#555555]">{s.notes}</p>}
    </div>
  );
};

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart, products } = useStore();
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [size, setSize] = useState("");
  const { t, pn, pd, term, sz } = useI18n();

  useEffect(() => {
    setProduct(null); setMissing(false);
    axios.get(`${API}/fitting-room/products/${id}`).then((r) => {
      setProduct(r.data);
      const sizes = r.data.sizing?.sizes || [];
      setSize(sizes.length === 1 ? sizes[0] : "");
    }).catch(() => setMissing(true));
  }, [id]);

  if (missing) return <p className="px-8 py-20 text-center text-sm uppercase" data-testid="product-not-found">{t("product.notFound")} <Link to="/shop/all" className="underline">{t("product.backToShop")}</Link></p>;
  if (!product) return <div className="h-[70vh]" />;

  const sizes = product.sizing?.sizes || [];
  const category = byCategoryId(product.category);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const add = () => {
    if (sizes.length > 1 && !size) return toast.error(t("product.pickSize"));
    addToCart([{ product_id: product.id, size }]).catch(() => toast.error(t("product.addFailed")));
  };

  return (
    <div data-testid="product-page">
      <div className="grid md:grid-cols-2">
        <div className="bg-[#f2f2f2]"><img src={product.image} alt={pn(product)} className="aspect-[4/5] w-full object-cover" data-testid="product-image" /></div>
        <div className="px-4 py-8 sm:px-10 lg:px-16">
          {category && <Link to={`/shop/${category.slug}`} className="text-xs font-bold uppercase text-[#555555] underline" data-testid="product-category-link">{term("cat", category.id)}</Link>}
          <h1 className="mt-3 text-3xl font-extrabold uppercase sm:text-4xl" data-testid="product-name">{pn(product)}</h1>
          <p className="mt-2 text-xl font-bold" data-testid="product-price">{money(product.price)}</p>
          <p className="mt-1 text-xs font-bold uppercase" style={{ color: RARITY_COLORS[product.rarity] }}>{term("rarity", product.rarity)} · <span className="text-[#555555]">{t("product.soldBy", { seller: product.seller })}</span></p>
          <p className="mt-6 text-sm font-extrabold uppercase">{t("product.size")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button key={s} onClick={() => setSize(s)} data-testid={`product-size-${s}`}
                className={`min-w-12 border border-black px-3 py-2 text-xs font-bold uppercase ${size === s ? "bg-black text-white" : "hover:bg-[#f2f2f2]"}`}>{sz(s)}</button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button onClick={add} disabled={!product.in_stock} className="fr-btn-primary flex-1" data-testid="product-add-to-bag">{product.in_stock ? t("product.addToBag") : t("product.soldOut")}</button>
            {product.wearable && <Link to={`/fitting-room?item=${product.id}`} className="fr-btn-ghost flex-1" data-testid="product-try-on">{t("product.tryOn")}</Link>}
          </div>
          <p className="mt-8 text-sm leading-relaxed" data-testid="product-description">{pd(product)}</p>
          <Row label={t("product.material")} value={product.material} />
          <Row label={t("product.color")} value={term("color", product.color)} />
          {product.sizing && <SizingDetails s={product.sizing} />}
        </div>
      </div>
      {related.length > 0 && (
        <section className="px-4 py-12 sm:px-8">
          <h2 className="mb-5 text-2xl font-extrabold uppercase sm:text-3xl">{t("product.alsoLike")}</h2>
          <ProductGrid products={related} testId="related-grid" />
        </section>
      )}
    </div>
  );
}
