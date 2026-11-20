import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Slider } from "../../components/ui/slider";
import { Switch } from "../../components/ui/switch";
import { CATEGORY_LABELS, DEFAULT_FILTERS, suggestedSize } from "./api";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const FilterSelect = ({ id, label, value, options, onChange }) => (
  <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? null : v)}>
    <SelectTrigger className="h-9 border-[#8f8f8f] bg-[#ffffff] text-sm text-[#000000]" data-testid={`catalog-filter-${id}`}>
      <SelectValue placeholder={label} />
    </SelectTrigger>
    <SelectContent className="border-[#8f8f8f] bg-[#ffffff] text-[#000000]">
      <SelectItem value="all">Any {label.toLowerCase()}</SelectItem>
      {options.map((o) => <SelectItem key={o} value={o} data-testid={`catalog-filter-${id}-${o}`}>{cap(o)}</SelectItem>)}
    </SelectContent>
  </Select>
);

const FitSwitch = ({ profile, fitOnly, setFitOnly }) => (
  <label className="flex items-center gap-3 rounded-none border border-[#8f8f8f] bg-[#ffffff] px-3 py-2 text-sm text-[#000000]" data-testid="fit-filter">
    <Switch checked={fitOnly} onCheckedChange={setFitOnly} data-testid="fit-filter-switch" />
    <span>Only gear that fits me</span>
    <span className="ml-auto text-xs text-[#555555]">Your size: <span className="font-mono text-[#000000]" data-testid="suggested-size">{suggestedSize(profile)}</span></span>
  </label>
);

const PriceFilter = ({ value, maxCap, onChange }) => {
  const price = value ?? maxCap;
  const sliderValue = useMemo(() => [price], [price]);
  return (
    <div className="flex flex-col justify-center gap-2" data-testid="catalog-filter-price">
      <span className="flex justify-between text-xs text-[#555555]"><span>Max price</span><span className="font-mono text-[#000000]" data-testid="catalog-price-value">${price}</span></span>
      <Slider min={10} max={maxCap} step={5} value={sliderValue} onValueChange={([v]) => onChange(v >= maxCap ? null : v)} />
    </div>
  );
};

const CategoryChips = ({ categories, value, onChange }) => (
  <div className="flex flex-wrap gap-2" data-testid="catalog-filter-category">
    {[null, ...categories].map((c) => (
      <button key={c || "all"} onClick={() => onChange(c)} data-testid={`category-chip-${c || "all"}`} className={`fr-chip ${value === c ? "fr-chip-active" : ""}`}>
        {c ? CATEGORY_LABELS[c] || cap(c) : "All gear"}
      </button>
    ))}
  </div>
);

export const CatalogFilters = ({ children, profile, fitOnly, setFitOnly, filters, setFilters, facets }) => {
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const maxCap = Math.ceil((facets.max_price || 150) / 10) * 10;
  const active = Object.entries(filters).some(([k, v]) => v && v !== DEFAULT_FILTERS[k]);
  return (
    <div className="space-y-4" data-testid="catalog-filters">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
        <input value={filters.q || ""} onChange={(e) => set({ q: e.target.value })} placeholder="Search gear, colors, roles..."
          className="h-10 w-full rounded-none border border-[#8f8f8f] bg-[#ffffff] pl-9 pr-3 text-sm text-[#000000] outline-none transition-colors placeholder:text-[#666666] focus:border-[#000000]" data-testid="catalog-search-input" />
      </div>
      {children}
      <CategoryChips categories={facets.categories} value={filters.category} onChange={(c) => set({ category: c })} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FilterSelect id="gender" label="Fit" value={filters.gender} options={facets.genders} onChange={(v) => set({ gender: v })} />
        <FilterSelect id="color" label="Color" value={filters.color} options={facets.colors} onChange={(v) => set({ color: v })} />
        <FilterSelect id="aesthetic" label="Aesthetic" value={filters.aesthetic} options={facets.aesthetics} onChange={(v) => set({ aesthetic: v })} />
        <PriceFilter value={filters.max_price} maxCap={maxCap} onChange={(v) => set({ max_price: v })} />
      </div>
      {profile && <FitSwitch profile={profile} fitOnly={fitOnly} setFitOnly={setFitOnly} />}
      {active && (
        <button onClick={() => setFilters(DEFAULT_FILTERS)} className="flex items-center gap-1 text-xs text-[#555555] transition-colors hover:text-[#555555]" data-testid="catalog-reset-filters">
          <X className="h-3 w-3" /> Reset filters
        </button>
      )}
    </div>
  );
};
