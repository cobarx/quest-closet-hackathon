import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useI18n } from "../../i18n";

// Labels are i18n keys (unit labels like "cm" fall back to themselves).
const GENDERS = [["men", "profile.men"], ["women", "profile.women"], ["other", "profile.other"]];

const Toggle = ({ options, value, onChange, id }) => {
  const { t } = useI18n();
  return (
  <div className="flex rounded-none border border-[#8f8f8f] p-0.5">
    {options.map(([v, label]) => (
      <button key={v} type="button" onClick={() => onChange(v)} data-testid={`${id}-${v}`}
        className={`flex-1 rounded-none px-2.5 py-1.5 text-xs transition-colors ${value === v ? "bg-[#000000] text-white" : "text-[#555555] hover:text-[#555555]"}`}>{t(label)}</button>
    ))}
  </div>
  );
};

const Field = ({ label, children }) => {
  const { t } = useI18n();
  return <label className="block space-y-1.5"><span className="text-xs uppercase tracking-wider text-[#555555]">{t(label)}</span>{children}</label>;
};

const inputCls = "h-10 w-full rounded-none border border-[#8f8f8f] bg-[#f2f2f2] px-3 text-sm text-[#000000] outline-none focus:border-[#000000]";

const HEIGHT_UNITS = [["cm", "cm"], ["ft", "ft/in"]];
const WEIGHT_UNITS = [["kg", "kg"], ["lb", "lb"]];
const LB = 0.4536;

const heightCm = (h) => (h.unit === "cm" ? Number(h.cm) : (Number(h.ft) * 12 + Number(h.inch || 0)) * 2.54);
const heightFrom = (cm, unit) => {
  const totalIn = cm ? Math.round(cm / 2.54) : 0;
  return { unit, cm: cm ? String(Math.round(cm)) : "", ft: cm ? String(Math.floor(totalIn / 12)) : "", inch: cm ? String(totalIn % 12) : "" };
};
const weightKg = (w) => (w.unit === "kg" ? Number(w.value) : Number(w.value) * LB);
const weightFrom = (kg, unit) => ({ unit, value: kg ? String(Math.round(unit === "kg" ? kg : kg / LB)) : "" });

const validate = (gender, cm, kg) => {
  if (!gender) return "profile.chooseFit";
  if (!(cm >= 100 && cm <= 250)) return "profile.heightRange";
  if (!(kg >= 25 && kg <= 300)) return "profile.weightRange";
  return "";
};

const HeightField = ({ height, setHeight }) => {
  const set = (patch) => setHeight((h) => ({ ...h, ...patch }));
  return (
    <Field label="profile.height">
      <div className="flex gap-2">
        {height.unit === "cm" ? (
          <input type="number" inputMode="numeric" value={height.cm} onChange={(e) => set({ cm: e.target.value })} placeholder="175" className={inputCls} data-testid="profile-height-cm" />
        ) : (
          <>
            <input type="number" value={height.ft} onChange={(e) => set({ ft: e.target.value })} placeholder="ft" className={inputCls} data-testid="profile-height-ft" />
            <input type="number" value={height.inch} onChange={(e) => set({ inch: e.target.value })} placeholder="in" className={inputCls} data-testid="profile-height-in" />
          </>
        )}
        <div className="w-28 shrink-0">
          <Toggle id="profile-height-unit" options={HEIGHT_UNITS} value={height.unit} onChange={(u) => setHeight((h) => heightFrom(heightCm(h), u))} />
        </div>
      </div>
    </Field>
  );
};

const WeightField = ({ weight, setWeight }) => (
  <Field label="profile.weight">
    <div className="flex gap-2">
      <input type="number" inputMode="numeric" value={weight.value} onChange={(e) => setWeight((w) => ({ ...w, value: e.target.value }))}
        placeholder={weight.unit === "kg" ? "70" : "155"} className={inputCls} data-testid="profile-weight" />
      <div className="w-28 shrink-0">
        <Toggle id="profile-weight-unit" options={WEIGHT_UNITS} value={weight.unit} onChange={(u) => setWeight((w) => weightFrom(weightKg(w), u))} />
      </div>
    </div>
  </Field>
);

export const ProfileDialog = ({ open, initial, onSave, onCancel }) => {
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState(() => heightFrom(0, "cm"));
  const [weight, setWeight] = useState(() => weightFrom(0, "kg"));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setGender(initial?.gender || "");
    setHeight(heightFrom(initial?.height_cm, "cm"));
    setWeight(weightFrom(initial?.weight_kg, "kg"));
  }, [open, initial]);

  const submit = (e) => {
    e.preventDefault();
    const cm = heightCm(height);
    const kg = weightKg(weight);
    const problem = validate(gender, cm, kg);
    if (problem) return setError(problem);
    onSave({ gender, height_cm: Math.round(cm), weight_kg: Math.round(kg) });
  };

  return (
    <ProfileDialogView open={open} onCancel={onCancel} submit={submit} gender={gender} setGender={setGender}
      height={height} setHeight={setHeight} weight={weight} setWeight={setWeight} error={error} />
  );
};

const ProfileDialogView = ({ open, onCancel, submit, gender, setGender, height, setHeight, weight, setWeight, error }) => {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto border-[#8f8f8f] bg-[#ffffff] text-[#000000]" data-testid="profile-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("profile.title")}</DialogTitle>
          <DialogDescription className="text-[#555555]">{t("profile.why")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="profile.fit"><Toggle id="profile-gender" options={GENDERS} value={gender} onChange={setGender} /></Field>
          <HeightField height={height} setHeight={setHeight} />
          <WeightField weight={weight} setWeight={setWeight} />
          {error && <p className="text-sm text-[#d0021b]" data-testid="profile-error">{t(error)}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} className="fr-btn-ghost flex-1" data-testid="profile-cancel-button">{t("profile.cancel")}</button>
            <button type="submit" className="fr-btn-primary flex-1" data-testid="profile-save-button">{t("profile.saveContinue")}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
