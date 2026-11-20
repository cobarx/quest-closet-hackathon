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
import { useApp } from "@/lib/appState";

const CITIES = ["Montréal", "Laval", "Longueuil", "Québec", "Gatineau", "Sherbrooke", "Trois-Rivières", "Saint-Jérôme", "Granby", "Drummondville", "Laurentides", "Lanaudière", "Montérégie", "Estrie", "Mauricie", "Autre / Other"];
const GENDERS = [["female", "g_woman"], ["male", "g_man"], ["non-binary person", "g_nb"], ["", "g_none"]];

const UnitInput = ({ unit, testId, ...props }) => (
  <div className="relative mt-1.5 flex-1">
    <Input type="number" min="0" className="bg-stone-950 pr-10" data-testid={testId} {...props} />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">{unit}</span>
  </div>
);

const toImperial = (cm, kg) => {
  const inches = cm ? Number(cm) / 2.54 : 0;
  const ft = Math.floor(inches / 12);
  return { ft: cm ? String(ft) : "", inch: cm ? String(Math.round(inches - ft * 12)) : "", lb: kg ? String(Math.round(Number(kg) * 2.20462)) : "" };
};

const BodyFields = ({ f, set }) => {
  const { t } = useLang();
  const [units, setUnits] = useState(() => localStorage.getItem("units") || "metric");
  const [imp, setImp] = useState(() => toImperial(f.height_cm, f.weight_kg));
  const metricKey = `${f.height_cm}|${f.weight_kg}`;
  const lastSet = useRef(metricKey);

  useEffect(() => {
    if (metricKey !== lastSet.current) setImp(toImperial(f.height_cm, f.weight_kg));
  }, [metricKey, f.height_cm, f.weight_kg]);

  const choose = (u) => { setUnits(u); localStorage.setItem("units", u); setImp(toImperial(f.height_cm, f.weight_kg)); };
  const setImperial = (k) => (e) => {
    const next = { ...imp, [k]: e.target.value };
    setImp(next);
    const inches = Number(next.ft || 0) * 12 + Number(next.inch || 0);
    const cm = next.ft || next.inch ? String(Math.round(inches * 2.54)) : "";
    const kg = next.lb ? String(Math.round(Number(next.lb) / 2.20462)) : "";
    lastSet.current = `${cm}|${kg}`;
    set("height_cm")(cm);
    set("weight_kg")(kg);
  };
  const opt = <span className="text-stone-500">({t("optional")})</span>;

  return (
    <>
      <div className="sm:col-span-2">
        <div className="inline-flex rounded-full border border-stone-700 p-0.5 text-xs font-semibold" data-testid="units-toggle">
          {["metric", "imperial"].map((u) => (
            <button key={u} type="button" onClick={() => choose(u)} data-testid={`units-${u}-btn`}
              className={`rounded-full px-3 py-1.5 transition-colors ${units === u ? "bg-amber-500 text-stone-950" : "text-stone-300 hover:text-amber-300"}`}>
              {t(`units_${u}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>{t("ob_height")} {opt}</Label>
        {units === "metric" ? (
          <UnitInput unit="cm" value={f.height_cm} onChange={(e) => set("height_cm")(e.target.value)} testId="onboarding-height-input" />
        ) : (
          <div className="flex gap-2">
            <UnitInput unit={t("unit_ft")} value={imp.ft} onChange={setImperial("ft")} testId="onboarding-height-ft-input" />
            <UnitInput unit={t("unit_in")} value={imp.inch} onChange={setImperial("inch")} testId="onboarding-height-in-input" />
          </div>
        )}
      </div>
      <div>
        <Label>{t("ob_weight")} {opt}</Label>
        {units === "metric"
          ? <UnitInput unit="kg" value={f.weight_kg} onChange={(e) => set("weight_kg")(e.target.value)} testId="onboarding-weight-input" />
          : <UnitInput unit="lb" value={imp.lb} onChange={setImperial("lb")} testId="onboarding-weight-lb-input" />}
      </div>
    </>
  );
};

export default function Profile() {
  const { t, lang } = useLang();
  const { api, profile, setProfile, toast } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [f, setF] = useState({ city: "Montréal", gender: "", height_cm: "", weight_kg: "", budget: 400 });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) setF((o) => ({ ...o, ...Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== null)) }));
  }, [profile]);

  const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));

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
      const body = { lang, city: f.city, gender: f.gender, budget: Number(f.budget),
        height_cm: f.height_cm ? Number(f.height_cm) : null, weight_kg: f.weight_kg ? Number(f.weight_kg) : null };
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
          <BodyFields f={f} set={set} />
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
