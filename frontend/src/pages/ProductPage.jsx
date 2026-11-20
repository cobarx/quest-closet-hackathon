import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useStore } from "../store/StoreContext";
import { byCategoryId, money } from "../store/catalog";
import { ProductGrid } from "../store/ProductCard";
import { RARITY_COLORS } from "../features/fitting-room/api";

const Row = ({ label, value }) => value ? (
  <div className="flex justify-between gap-4 border-b border-[#8f8f8f] py-2 text-xs uppercase"><span className="text-[#555555]">{label}</span><span className="text-right font-bold">{value}</span></div>
) : null;

const SizingDetails = ({ s }) => (
  <div className="mt-8" data-testid="product-sizing">
    <p className="mb-2 text-sm font-extrabold uppercase">Sizing</p>
    <Row label="Sizes" value={s.sizes.join(" / ")} />
    <Row label="Length" value={s.length_cm ? `${s.length_cm} cm` : ""} />
    <Row label="Measurements" value={s.measurements} />
    <Row label="Fits height" value={`${s.min_height_cm}-${s.max_height_cm} cm`} />
    <Row label="Fits weight" value={`${s.min_weight_kg}-${s.max_weight_kg} kg`} />
    <Row label="Adjustable" value={s.adjustable ? "Yes" : "No"} />
    {s.one_of_a_kind && <Row label="Availability" value="One of a kind" />}
    {s.notes && <p className="mt-2 text-xs text-[#555555]">{s.notes}</p>}
  </div>
);

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart, products } = useStore();
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [size, setSize] = useState("");

  useEffect(() => {
    setProduct(null); setMissing(false);
    axios.get(`${API}/fitting-room/products/${id}`).then((r) => {
      setProduct(r.data);
      const sizes = r.data.sizing?.sizes || [];
      setSize(sizes.length === 1 ? sizes[0] : "");
    }).catch(() => setMissing(true));
  }, [id]);

  if (missing) return <p className="px-8 py-20 text-center text-sm uppercase" data-testid="product-not-found">This listing no longer exists. <Link to="/shop/all" className="underline">Back to shop</Link></p>;
  if (!product) return <div className="h-[70vh]" />;

  const sizes = product.sizing?.sizes || [];
  const category = byCategoryId(product.category);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const add = () => {
    if (sizes.length > 1 && !size) return toast.error("Pick a size first");
    addToCart([{ product_id: product.id, size }]).catch(() => toast.error("Could not add to bag"));
  };

  return (
    <div data-testid="product-page">
      <div className="grid md:grid-cols-2">
        <div className="bg-[#f2f2f2]"><img src={product.image} alt={product.name} className="aspect-[4/5] w-full object-cover" data-testid="product-image" /></div>
        <div className="px-4 py-8 sm:px-10 lg:px-16">
          {category && <Link to={`/shop/${category.slug}`} className="text-xs font-bold uppercase text-[#555555] underline" data-testid="product-category-link">{category.label}</Link>}
          <h1 className="mt-3 text-3xl font-extrabold uppercase sm:text-4xl" data-testid="product-name">{product.name}</h1>
          <p className="mt-2 text-xl font-bold" data-testid="product-price">{money(product.price)}</p>
          <p className="mt-1 text-xs font-bold uppercase" style={{ color: RARITY_COLORS[product.rarity] }}>{product.rarity} · <span className="text-[#555555]">Sold by {product.seller}</span></p>
          <p className="mt-6 text-sm font-extrabold uppercase">Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button key={s} onClick={() => setSize(s)} data-testid={`product-size-${s}`}
                className={`min-w-12 border border-black px-3 py-2 text-xs font-bold uppercase ${size === s ? "bg-black text-white" : "hover:bg-[#f2f2f2]"}`}>{s}</button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button onClick={add} disabled={!product.in_stock} className="fr-btn-primary flex-1" data-testid="product-add-to-bag">{product.in_stock ? "Add to bag" : "Sold out"}</button>
            {product.wearable && <Link to={`/fitting-room?item=${product.id}`} className="fr-btn-ghost flex-1" data-testid="product-try-on">Try it on me</Link>}
          </div>
          <p className="mt-8 text-sm leading-relaxed">{product.description}</p>
          <Row label="Material" value={product.material} />
          <Row label="Color" value={product.color} />
          {product.sizing && <SizingDetails s={product.sizing} />}
        </div>
      </div>
      {related.length > 0 && (
        <section className="px-4 py-12 sm:px-8">
          <h2 className="mb-5 text-2xl font-extrabold uppercase sm:text-3xl">You may also like</h2>
          <ProductGrid products={related} testId="related-grid" />
        </section>
      )}
    </div>
  );
}
