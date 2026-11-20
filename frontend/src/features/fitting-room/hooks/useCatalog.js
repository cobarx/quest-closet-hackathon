import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_FILTERS } from "../api";

const EMPTY_FACETS = { categories: [], genders: [], colors: [], aesthetics: [], max_price: 150 };

const toParams = (filters, fitOnly, profile) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== null && v !== ""));
  return fitOnly && profile ? { ...params, height_cm: profile.height_cm, weight_kg: profile.weight_kg } : params;
};

export const useCatalog = (api, profile) => {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState(EMPTY_FACETS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [fitOnly, setFitOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const byId = useMemo(() => Object.fromEntries(allProducts.map((p) => [p.id, p])), [allProducts]);

  useEffect(() => {
    api.products().then(setAllProducts).catch(() => toast.error("Could not load the catalog"));
    api.facets().then(setFacets).catch(() => {});
  }, [api]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const t = setTimeout(() => {
      api.products(toParams(filters, fitOnly, profile))
        .then((data) => live && setProducts(data))
        .catch(() => live && toast.error("Filter failed"))
        .finally(() => live && setLoading(false));
    }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [api, filters, fitOnly, profile]);

  return { allProducts, byId, products, facets, filters, setFilters, fitOnly, setFitOnly, loading };
};
