import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STRINGS } from "./strings";

// FR/EN for the whole site. Choice is saved on the device; first visit follows the browser language.
const STORAGE_KEY = "qc_lang";
export const LANGS = ["en", "fr"];

const initialLang = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* storage blocked: fall through to browser language */ }
  return (navigator.language || "").toLowerCase().startsWith("fr") ? "fr" : "en";
};

const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "")) : text);

export const makeI18n = (lang, setLang = () => {}) => {
  const other = lang === "fr" ? "en" : "fr";
  return {
    lang,
    setLang,
    t: (key, vars) => fill(STRINGS[lang][key] ?? STRINGS.en[key] ?? key, vars),
    // Product text: French copy when available, English otherwise.
    pn: (p) => (lang === "fr" && p?.name_fr) || p?.name || "",
    pd: (p) => (lang === "fr" && p?.description_fr) || p?.description || "",
    // Event text: field_<lang>, then the other language, then the legacy single-language field.
    ev: (e, field) => e?.[`${field}_${lang}`] || e?.[`${field}_${other}`] || e?.[field] || "",
    // Size labels: the catalog stores "One size" in English.
    sz: (label) => (lang === "fr" ? String(label || "").replace(/One size/g, "Taille unique") : label || ""),
    // Facet values (categories, colors, rarity...) with a readable fallback.
    term: (group, value) => {
      if (!value) return "";
      const hit = STRINGS[lang][`${group}.${value}`] ?? STRINGS.en[`${group}.${value}`];
      return hit ?? value.charAt(0).toUpperCase() + value.slice(1);
    },
  };
};

const I18nCtx = createContext(makeI18n("en"));

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState(initialLang);
  const setLang = useCallback((l) => {
    if (!LANGS.includes(l)) return;
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* storage blocked: keep in memory */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang === "fr" ? "fr-CA" : "en"; }, [lang]);
  const value = useMemo(() => makeI18n(lang, setLang), [lang, setLang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
};

export const useI18n = () => useContext(I18nCtx);

export const LangToggle = ({ className = "" }) => {
  const { lang, setLang } = useI18n();
  return (
    <div className={`flex items-center text-xs font-bold uppercase ${className}`} role="group" aria-label="Language" data-testid="lang-toggle">
      {LANGS.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1 text-[#8f8f8f]">/</span>}
          <button onClick={() => setLang(l)} aria-pressed={lang === l} data-testid={`lang-toggle-${l}`}
            className={lang === l ? "text-black underline underline-offset-4" : "text-[#555555] hover:text-black"}>{l}</button>
        </span>
      ))}
    </div>
  );
};
