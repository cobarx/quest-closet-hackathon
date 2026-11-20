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
  const [f, setF] = useState({ city: "Montréal", gender: "", height_cm: "", weight_kg: "", budget: 400, height_unit: "cm", weight_unit: "kg" });
  const [imp, setImp] = useState({ ft: "", inch: "", lb: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loaded = useRef(false);
  useEffect(() => {
    // Fill the form once from the saved profile; later profile updates (e.g. selfie upload) must not wipe unsaved edits.
    if (!profile || loaded.current) return;
    loaded.current = true;
    const legacyImp = profile.units === "imperial"; // older profiles saved one shared unit choice
    setF((o) => ({
      ...o, ...Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== null)),
      height_unit: profile.height_unit || (legacyImp ? "ftin" : "cm"),
      weight_unit: profile.weight_unit || (legacyImp ? "lb" : "kg"),
    }));
    setImp({ ...cmToFtIn(profile.height_cm), lb: kgToLb(profile.weight_kg) });
  }, [profile]);

  const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
  const setI = (k) => (v) => setImp((o) => ({ ...o, [k]: v }));
  const isFtIn = f.height_unit === "ftin";
  const isLb = f.weight_unit === "lb";

  const switchHeight = (u) => {
    if (u === f.height_unit) return;
    if (u === "ftin") setImp((o) => ({ ...o, ...cmToFtIn(f.height_cm) }));
    else { const h = ftInToCm(imp.ft, imp.inch); set("height_cm")(h === null ? "" : String(h)); }
    set("height_unit")(u);
  };
  const switchWeight = (u) => {
    if (u === f.weight_unit) return;
    if (u === "lb") setI("lb")(kgToLb(f.weight_kg));
    else { const w = lbToKg(imp.lb); set("weight_kg")(w === null ? "" : String(w)); }
    set("weight_unit")(u);
  };

  const metricValues = () => ({
    height_cm: isFtIn ? ftInToCm(imp.ft, imp.inch) : (f.height_cm ? Number(f.height_cm) : null),
    weight_kg: isLb ? lbToKg(imp.lb) : (f.weight_kg ? Number(f.weight_kg) : null),
  });

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
      const body = { lang, city: f.city, gender: f.gender, budget: Number(f.budget), height_unit: f.height_unit || "cm", weight_unit: f.weight_unit || "kg",
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
          <div className="grid gap-5 sm:col-span-2 sm:grid-cols-2" data-testid="body-measurements-row">
            <div>
              <Label>{t("ob_height")} <span className="text-stone-500">({t("optional")})</span></Label>
              <div className="mt-1.5 flex gap-2">
                {isFtIn ? (
                  <>
                    <div className="relative min-w-0 flex-1">
                      <Input type="number" min="0" className="bg-stone-950 pr-8" value={imp.ft} onChange={(e) => setI("ft")(e.target.value)} data-testid="onboarding-height-ft-input" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">{lang === "fr" ? "pi" : "ft"}</span>
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <Input type="number" min="0" max="11" className="bg-stone-950 pr-8" value={imp.inch} onChange={(e) => setI("inch")(e.target.value)} data-testid="onboarding-height-in-input" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">{lang === "fr" ? "po" : "in"}</span>
                    </div>
                  </>
                ) : (
                  <Input type="number" className="min-w-0 flex-1 bg-stone-950" value={f.height_cm} onChange={(e) => set("height_cm")(e.target.value)} data-testid="onboarding-height-input" />
                )}
                <Select value={f.height_unit || "cm"} onValueChange={switchHeight}>
                  <SelectTrigger className="w-24 shrink-0 bg-stone-950" data-testid="onboarding-height-unit-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm" data-testid="height-unit-cm-option">cm</SelectItem>
                    <SelectItem value="ftin" data-testid="height-unit-ftin-option">{t("unit_ftin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("ob_weight")} <span className="text-stone-500">({t("optional")})</span></Label>
              <div className="mt-1.5 flex gap-2">
                {isLb
                  ? <Input type="number" min="0" className="min-w-0 flex-1 bg-stone-950" value={imp.lb} onChange={(e) => setI("lb")(e.target.value)} data-testid="onboarding-weight-lb-input" />
                  : <Input type="number" className="min-w-0 flex-1 bg-stone-950" value={f.weight_kg} onChange={(e) => set("weight_kg")(e.target.value)} data-testid="onboarding-weight-input" />}
                <Select value={f.weight_unit || "kg"} onValueChange={switchWeight}>
                  <SelectTrigger className="w-24 shrink-0 bg-stone-950" data-testid="onboarding-weight-unit-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg" data-testid="weight-unit-kg-option">kg</SelectItem>
                    <SelectItem value="lb" data-testid="weight-unit-lb-option">{t("unit_lbs")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
