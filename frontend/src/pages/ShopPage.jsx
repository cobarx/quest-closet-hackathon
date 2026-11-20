import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search } from "lucide-react";
import { API } from "../store/StoreContext";
import { bySlug } from "../store/catalog";
import { ProductGrid } from "../store/ProductCard";

const SORTS = { recommended: "Recommended", low: "Price: low to high", high: "Price: high to low" };

export default function ShopPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = bySlug(slug);
  const [products, setProducts] = useState(null);
  const [sort, setSort] = useState("recommended");

  useEffect(() => {
    let live = true;
    setProducts(null);
    const t = setTimeout(() => {
      axios.get(`${API}/fitting-room/products`, { params: { category: category?.id, q: q || undefined } })
        .then((r) => live && setProducts(r.data)).catch(() => live && setProducts([]));
    }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [category?.id, q]);

  const sorted = useMemo(() => {
    if (!products) return [];
    if (sort === "recommended") return [...products].sort((a, b) => a.name.localeCompare(b.name));
    return [...products].sort((a, b) => (sort === "low" ? a.price - b.price : b.price - a.price));
  }, [products, sort]);

  return (
    <div className="px-4 py-8 sm:px-8" data-testid="shop-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase sm:text-5xl" data-testid="shop-title">{category?.label || (q ? `“${q}”` : "All gear")}</h1>
          <p className="mt-1 text-xs font-bold uppercase text-[#555555]" data-testid="shop-count">{products ? `${products.length} items` : "Loading…"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 border border-black px-3 py-2">
            <Search className="h-4 w-4" />
            <input value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} placeholder="SEARCH" data-testid="shop-search-input"
              className="w-40 bg-transparent text-xs font-semibold uppercase outline-none placeholder:text-black" />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-black bg-white px-3 py-2 text-xs font-bold uppercase" data-testid="shop-sort-select">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-6">
        {products && !products.length ? <p className="py-20 text-center text-sm uppercase text-[#555555]" data-testid="shop-empty">No gear found.</p> : <ProductGrid products={sorted} />}
      </div>
    </div>
  );
}
