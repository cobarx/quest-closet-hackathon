import axios from "axios";

export const createApi = (base) => {
  const http = axios.create({ baseURL: `${base}/api/fitting-room` });
  return {
    products: (params) => http.get("/products", { params: { wearable: true, ...params } }).then((r) => r.data),
    facets: () => http.get("/facets").then((r) => ({ ...r.data, categories: r.data.categories.filter((c) => c !== "camping") })),
    tryOn: (body) => http.post("/tryon", body, { timeout: 150000 }).then((r) => r.data),
    assistant: (body) => http.post("/assistant", body, { timeout: 90000 }).then((r) => r.data),
  };
};

export const errorText = (e, fallback) => {
  const d = e?.response?.data?.detail;
  return typeof d === "string" ? d : fallback;
};

export const fitsProfile = (item, profile) => {
  const s = item.sizing;
  if (!profile || !s) return null;
  return profile.height_cm >= s.min_height_cm && profile.height_cm <= s.max_height_cm
    && profile.weight_kg >= s.min_weight_kg && profile.weight_kg <= s.max_weight_kg;
};

const LETTERS = ["XS", "S", "M", "L", "XL", "XXL"];
export const suggestedSize = ({ height_cm: h, weight_kg: w }) => {
  let i = h < 155 ? 0 : h < 165 ? 1 : h < 178 ? 2 : h < 188 ? 3 : 4;
  const bmi = w / (h / 100) ** 2;
  if (bmi > 28) i += 1;
  if (bmi < 19) i -= 1;
  return LETTERS[Math.max(0, Math.min(5, i))];
};

export const sizeLabel = (s) => (!s ? "" : s.sizes.length > 2 ? `${s.sizes[0]}-${s.sizes[s.sizes.length - 1]}` : s.sizes.join(" / "));

export const downscale = (src, max = 900) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = reject;
    img.src = src;
  });

export const CATEGORY_LABELS = {
  helmet: "Helmets", armor: "Armor", cloak: "Cloaks", tunic: "Tunics & Robes",
  boots: "Shoes & Boots", weapon: "Weapons", shield: "Shields", accessory: "Accessories", makeup: "Makeup & FX", camping: "Camping",
};

export const SLOT_ORDER = ["helmet", "makeup", "armor", "tunic", "cloak", "boots", "weapon", "shield", "accessory"];

export const RARITY_COLORS = {
  common: "#94a3b8", uncommon: "#38bdf8", rare: "#a855f7", epic: "#f59e0b", legendary: "#ef4444",
};

export const DEFAULT_FILTERS = { category: null, gender: null, color: null, aesthetic: null, max_price: null, q: "" };

export const outfitKey = (equipped, note) =>
  Object.values(equipped).map((i) => i.id).sort().join(",") + "|" + (note || "");

export const applyOps = ({ equipped, bench }, { equip = [], unequip = [], remove = [], clear = false }, byId) => {
  const eq = clear ? {} : { ...equipped };
  const bn = clear ? {} : { ...bench };
  unequip.forEach((id) => { const p = byId[id]; if (p && eq[p.category]?.id === id) { delete eq[p.category]; bn[id] = p; } });
  remove.forEach((id) => { const p = byId[id]; if (!p) return; if (eq[p.category]?.id === id) delete eq[p.category]; delete bn[id]; });
  equip.forEach((id) => {
    const p = byId[id];
    if (!p) return;
    const cur = eq[p.category];
    if (cur && cur.id !== id) bn[cur.id] = cur;
    eq[p.category] = p;
    delete bn[id];
  });
  return { equipped: eq, bench: bn };
};
