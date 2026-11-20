import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthImage } from "@/components/AuthImage";
import { useLang, money } from "@/lib/i18n";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/units";
import { useApp } from "@/lib/appState";

const CITIES = ["Montréal", "Laval", "Longueuil", "Québec", "Gatineau", "Sherbrooke", "Trois-Rivières", "Saint-Jérôme", "Granby", "Drummondville", "Laurentides", "Lanaudière", "Montérégie", "Estrie", "Mauricie", "Autre / Other"];
const GENDERS = [["female", "g_woman"], ["male", "g_man"], ["non-binary person", "g_nb"], ["", "g_none"]];

export default function Profile() {
  const { t, lang } = useLang();
  const { api, profile, setProfile, toast } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [f, setF] = useState({ city: "Montréal", gender: "", height_cm: "", weight_kg: "", budget: 400, units: "metric" });
  const [imp, setImp] = useState({ ft: "", inch: "", lb: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loaded = useRef(false);
  useEffect(() => {
    // Fill the form once from the saved profile; later profile updates (e.g. selfie upload) must not wipe unsaved edits.
    if (!profile || loaded.current) return;
    loaded.current = true;
    setF((o) => ({ ...o, ...Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== null)) }));
    setImp({ ...cmToFtIn(profile.height_cm), lb: kgToLb(profile.weight_kg) });
  }, [profile]);

  const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
  const setI = (k) => (v) => setImp((o) => ({ ...o, [k]: v }));
  const isImp = f.units === "imperial";

  const switchUnits = (u) => {
    if (u === f.units) return;
    if (u === "imperial") {
      setImp({ ...cmToFtIn(f.height_cm), lb: kgToLb(f.weight_kg) });
    } else {
      const h = ftInToCm(imp.ft, imp.inch), w = lbToKg(imp.lb);
      setF((o) => ({ ...o, height_cm: h === null ? "" : String(h), weight_kg: w === null ? "" : String(w) }));
    }
    set("units")(u);
  };

  const metricValues = () => isImp
    ? { height_cm: ftInToCm(imp.ft, imp.inch), weight_kg: lbToKg(imp.lb) }
    : { height_cm: f.height_cm ? Number(f.height_cm) : null, weight_kg: f.weight_kg ? Number(f.weight_kg) : null };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api("post", "/profile/selfie", fd);
      setProfile((p) => ({ ...p, ...r }));
    } catch (e) {
      toast.error(e.response?.data?.detail || t("error"));
    } finally { setUploading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { lang, city: f.city, gender: f.gender, budget: Number(f.budget), units: f.units || "metric",
        ...metricValues() };
      const r = await api("put", "/profile", body);
      setProfile(r);
      toast.success(t("saved"));
      navigate("/");
    } catch (e) {
      toast.error(t("error"));
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" data-testid="onboarding-dialog">
      <h1 className="text-3xl font-bold text-amber-50 sm:text-4xl">{t("ob_title")}</h1>
      <p className="mt-2 text-sm text-stone-400">{t("ob_sub")}</p>

      <div className="mt-8 space-y-6 rounded-2xl border border-stone-800 leather p-5 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>{t("ob_city")}</Label>
            <Select value={f.city || undefined} onValueChange={set("city")}>
              <SelectTrigger className="mt-1.5 bg-stone-950" data-testid="onboarding-city-select"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("ob_gender")}</Label>
            <Select value={f.gender || "none"} onValueChange={(v) => set("gender")(v === "none" ? "" : v)}>
              <SelectTrigger className="mt-1.5 bg-stone-950" data-testid="onboarding-gender-select"><SelectValue /></SelectTrigger>
              <SelectContent>{GENDERS.map(([v, k]) => <SelectItem key={k} value={v || "none"}>{t(k)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-5 sm:col-span-2 sm:grid-cols-[1fr_1fr_auto]" data-testid="body-measurements-row">
            <div>
              <Label>{t("ob_height")} <span className="text-stone-500">({t("optional")})</span></Label>
              {isImp ? (
                <div className="mt-1.5 flex gap-2">
                  <div className="relative flex-1">
                    <Input type="number" min="0" className="bg-stone-950 pr-9" value={imp.ft} onChange={(e) => setI("ft")(e.target.value)} data-testid="onboarding-height-ft-input" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">{lang === "fr" ? "pi" : "ft"}</span>
                  </div>
                  <div className="relative flex-1">
                    <Input type="number" min="0" max="11" className="bg-stone-950 pr-9" value={imp.inch} onChange={(e) => setI("inch")(e.target.value)} data-testid="onboarding-height-in-input" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">{lang === "fr" ? "po" : "in"}</span>
                  </div>
                </div>
              ) : (
                <div className="relative mt-1.5">
                  <Input type="number" className="bg-stone-950 pr-10" value={f.height_cm} onChange={(e) => set("height_cm")(e.target.value)} data-testid="onboarding-height-input" />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">cm</span>
                </div>
              )}
            </div>
            <div>
              <Label>{t("ob_weight")} <span className="text-stone-500">({t("optional")})</span></Label>
              <div className="relative mt-1.5">
                {isImp
                  ? <Input type="number" min="0" className="bg-stone-950 pr-10" value={imp.lb} onChange={(e) => setI("lb")(e.target.value)} data-testid="onboarding-weight-lb-input" />
                  : <Input type="number" className="bg-stone-950 pr-10" value={f.weight_kg} onChange={(e) => set("weight_kg")(e.target.value)} data-testid="onboarding-weight-input" />}
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">{isImp ? "lb" : "kg"}</span>
              </div>
            </div>
            <div>
              <Label>{t("ob_units")}</Label>
              <Select value={f.units || "metric"} onValueChange={switchUnits}>
                <SelectTrigger className="mt-1.5 bg-stone-950 sm:w-52" data-testid="onboarding-units-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric" data-testid="units-metric-option">{t("units_metric")}</SelectItem>
                  <SelectItem value="imperial" data-testid="units-imperial-option">{t("units_imperial")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between"><Label>{t("ob_budget")}</Label>
            <span className="font-display text-amber-300" data-testid="onboarding-budget-value">{money(f.budget, lang)}</span></div>
          <Slider className="mt-3" min={100} max={2500} step={25} value={[Number(f.budget)]} onValueChange={([v]) => set("budget")(v)} data-testid="onboarding-budget-slider" />
        </div>

        <div>
          <Label>{t("ob_selfie")}</Label>
          <p className="text-xs text-stone-500">{t("ob_selfie_hint")}</p>
          <div className="mt-3 flex items-center gap-4">
            {profile?.selfie_path
              ? <AuthImage path={profile.selfie_path} className="h-24 w-24 rounded-xl object-cover" testId="selfie-thumbnail" />
              : <div className="grid h-24 w-24 place-items-center rounded-xl border border-dashed border-stone-700"><Camera className="text-stone-500" /></div>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files[0])} data-testid="selfie-file-input" />
            <Button variant="outline" onClick={() => fileRef.current.click()} disabled={uploading} data-testid="selfie-upload-btn">
              {uploading && <Loader2 className="mr-2 animate-spin" size={16} />}{profile?.selfie_path ? t("ob_replace") : t("ob_upload")}
            </Button>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full rounded-full sm:w-auto sm:px-10" data-testid="onboarding-save-btn">
          {saving && <Loader2 className="mr-2 animate-spin" size={16} />}{t("save")}
        </Button>
      </div>
    </div>
  );
}
