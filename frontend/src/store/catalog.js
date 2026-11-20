export const CATEGORIES = [
  { id: "helmet", slug: "helmets", label: "Helmets", cover: "helm-silver-sallet" },
  { id: "armor", slug: "armor", label: "Armor", cover: "armor-gothic-cuirass" },
  { id: "tunic", slug: "robes-tunics", label: "Robes & Tunics", cover: "tunic-witch-robe" },
  { id: "cloak", slug: "cloaks", label: "Cloaks", cover: "cloak-shadow-ranger" },
  { id: "boots", slug: "shoes", label: "Shoes & Boots", cover: "boots-black-riding" },
  { id: "weapon", slug: "weapons", label: "Weapons", cover: "weapon-arcane-staff" },
  { id: "shield", slug: "shields", label: "Shields", cover: "shield-heraldic-kite" },
  { id: "accessory", slug: "accessories", label: "Accessories", cover: "acc-raven-amulet" },
  { id: "makeup", slug: "makeup-fx", label: "Makeup & FX", cover: "mk-orc-kit" },
  { id: "camping", slug: "camping", label: "Camping", cover: "camp-canvas-tent" },
];

export const bySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);
export const byCategoryId = (id) => CATEGORIES.find((c) => c.id === id);

export const IMG = "https://static.prod-images.emergentagent.com/jobs/33ff85bf-49f6-42d5-8a74-502778b34535/images/";
export const HERO = `${IMG}aabe29ab72c622e281c531235f4209db54e5add48dd4f9c6606590dcba92fd8c.jpeg`;
export const LOOKS = [
  { id: "rogue", label: "Rogue", image: `${IMG}eedf29c50ca6787c9cd65ed1ee91af609d018bfbb9f5b55e24b4aebb28d5a442.jpeg` },
  { id: "paladin", label: "Paladin", image: `${IMG}dbb73dfdfd5eaa63d1b619d2bdebe71ca1d3e85573cfa989c5059efd6131917a.jpeg` },
  { id: "witch", label: "Witch", image: `${IMG}d6b09df399eebe2f5c6e60b0229db01effec0bda1f84d2ce26b0570323d065ee.jpeg` },
  { id: "viking", label: "Viking", image: `${IMG}f2d847fae30e4ff2130878c4a2432265f2de7bbb9f8f95e75de4439129f61f7b.jpeg` },
];

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;
