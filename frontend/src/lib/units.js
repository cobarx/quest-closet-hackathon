// Height/weight are stored in metric (cm, kg); standard units are display/entry only.
const num = (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

export const cmToFtIn = (cm) => {
  const c = num(cm);
  if (c === null || c <= 0) return { ft: "", inch: "" };
  const total = c / 2.54;
  let ft = Math.floor(total / 12);
  let inch = Math.round(total - ft * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  return { ft: String(ft), inch: String(inch) };
};

export const ftInToCm = (ft, inch) => {
  const f = num(ft), i = num(inch);
  if (f === null && i === null) return null;
  const total = (f || 0) * 12 + (i || 0);
  return total > 0 ? Math.round(total * 2.54) : null;
};

export const kgToLb = (kg) => {
  const k = num(kg);
  return k === null || k <= 0 ? "" : String(Math.round(k * 2.20462));
};

export const lbToKg = (lb) => {
  const l = num(lb);
  return l === null || l <= 0 ? null : Math.round(l / 2.20462);
};
