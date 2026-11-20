import { useRef, useState } from "react";
import { Camera, Upload, Sparkles, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { CameraDialog } from "./CameraDialog";
import { MirrorLoading } from "./MirrorLoading";
import { useI18n } from "../../i18n";

// Absolutely fills the 4:5 frame and centers a width-capped stack, so it fits at any column width.
const EmptyMirror = ({ onCamera, onUpload }) => {
  const { t } = useI18n();
  return (
    <div className="fr-mirror-empty absolute inset-0 flex items-center justify-center overflow-hidden p-4 sm:p-5" data-testid="mirror-empty">
      <div className="flex w-full max-w-[19rem] flex-col items-center gap-3 text-center sm:gap-4">
        <div className="fr-mirror-sigil shrink-0"><Camera className="h-8 w-8 text-[#000000]" /></div>
        <div className="w-full">
          <p className="font-display text-lg leading-tight text-[#000000] sm:text-xl">{t("mirror.emptyTitle")}</p>
          <p className="mt-2 text-[13px] leading-snug text-[#555555] sm:text-sm">{t("mirror.emptyBody")}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <button onClick={onCamera} className="fr-btn-primary w-full min-w-0 px-3" data-testid="selfie-webcam-trigger"><Camera className="h-4 w-4 shrink-0" /><span>{t("mirror.takeSelfie")}</span></button>
          <button onClick={onUpload} className="fr-btn-ghost w-full min-w-0 px-3" data-testid="selfie-upload-trigger"><Upload className="h-4 w-4 shrink-0" /><span>{t("mirror.upload")}</span></button>
        </div>
      </div>
    </div>
  );
};

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const chip = "rounded-full bg-white/90 px-3 py-1 text-xs";

const readImageFile = (file, onLoad, t) => {
  if (!file.type.startsWith("image/")) return toast.error(t("mirror.notImage"));
  if (file.size > MAX_UPLOAD_BYTES) return toast.error(t("mirror.tooBig"));
  const reader = new FileReader();
  reader.onload = () => onLoad(reader.result);
  reader.readAsDataURL(file);
};

const MirrorHeader = ({ selfie, profile, onEditProfile, onNewPhoto }) => {
  const { t, term } = useI18n();
  return (
  <div className="flex items-center justify-between gap-3 border-b border-[#8f8f8f] px-5 py-3">
    <span className="fr-eyebrow shrink-0">{t("mirror.title")}</span>
    {selfie && (
      <div className="flex items-center gap-3">
        {profile && (
          <button onClick={onEditProfile} className="rounded-full border border-[#8f8f8f] px-2.5 py-0.5 text-[11px] text-[#555555] transition-colors hover:border-[#000000] hover:text-[#555555]" data-testid="profile-chip">
            {profile.height_cm} cm · {profile.weight_kg} kg · {term("gender", profile.gender)}
          </button>
        )}
        <button onClick={onNewPhoto} className="text-xs text-[#555555] transition-colors hover:text-[#555555]" data-testid="selfie-retake-button">{t("mirror.newPhoto")}</button>
      </div>
    )}
  </div>
  );
};

const CompareButton = ({ onPeek }) => {
  const { t } = useI18n();
  return (
  <button onPointerDown={() => onPeek(true)} onPointerUp={() => onPeek(false)} onPointerLeave={() => onPeek(false)}
    className={`absolute right-3 top-3 flex items-center gap-1.5 ${chip} text-[#000000] transition-colors hover:text-[#555555]`} data-testid="mirror-compare-button">
    <Eye className="h-3.5 w-3.5" /> {t("mirror.holdOriginal")}
  </button>
  );
};

const MirrorStage = ({ selfie, preview, generating, itemCount, onCamera, onUpload }) => {
  const [peek, setPeek] = useState(false);
  const { t } = useI18n();
  const shown = peek || !preview ? selfie : preview;
  const idle = selfie && !generating;
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f2f2f2]" data-testid="mirror-stage">
      {selfie
        ? <img src={shown} alt={t("mirror.previewAlt")} className="fr-fade-in absolute inset-0 h-full w-full object-contain object-center" data-testid="virtual-tryon-preview-image" key={shown.slice(-40)} />
        : <EmptyMirror onCamera={onCamera} onUpload={onUpload} />}
      {generating && <MirrorLoading />}
      {idle && preview && !itemCount && <span className={`absolute left-3 top-3 ${chip} text-[#555555]`} data-testid="mirror-base-label">{t("mirror.baseModel")}</span>}
      {generating && !preview && <span className={`absolute left-3 top-3 ${chip} text-[#555555]`} data-testid="mirror-building-label">{t("mirror.building")}</span>}
      {idle && preview && <CompareButton onPeek={setPeek} />}
    </div>
  );
};

const generateLabel = ({ generating, preview, dirty, itemCount }, t) => {
  if (generating) return t("mirror.conjuring");
  if (preview) return dirty ? t("mirror.update") : itemCount ? t("mirror.regenerate") : t("mirror.regenerateBase");
  if (!itemCount) return t("mirror.buildBase");
  return itemCount === 1 ? t("mirror.tryOnOne") : t("mirror.tryOnMany", { n: itemCount });
};

const MirrorActions = ({ preview, generating, dirty, itemCount, onGenerate, looks, onPickLook }) => {
  const { t } = useI18n();
  return (
  <div className="space-y-3 p-4">
    <button onClick={onGenerate} disabled={generating} className={`fr-btn-primary w-full ${dirty ? "fr-pulse" : ""}`} data-testid="generate-tryon-button">
      {preview ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      {generateLabel({ generating, preview, dirty, itemCount }, t)}
    </button>
    {looks.length > 0 && (
      <div className="flex gap-2 overflow-x-auto pb-1" data-testid="looks-history">
        {looks.map((look) => (
          <button key={look.id} onClick={() => onPickLook(look)} className="h-14 w-11 shrink-0 overflow-hidden rounded-none border border-[#8f8f8f] transition-colors hover:border-[#000000]" data-testid={`look-history-${look.id}`}>
            <img src={look.image} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    )}
  </div>
  );
};

export const SelfieMirror = ({ profile, onEditProfile, selfie, onSelfie, preview, generating, onGenerate, dirty, looks, onPickLook, itemCount }) => {
  const [camOpen, setCamOpen] = useState(false);
  const fileRef = useRef(null);
  const { t } = useI18n();
  const openFile = () => fileRef.current?.click();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) readImageFile(file, onSelfie, t);
  };

  return (
    <section className="fr-panel overflow-hidden" data-testid="fitting-mirror">
      <MirrorHeader selfie={selfie} profile={profile} onEditProfile={onEditProfile} onNewPhoto={openFile} />
      <MirrorStage selfie={selfie} preview={preview} generating={generating} itemCount={itemCount} onCamera={() => setCamOpen(true)} onUpload={openFile} />
      {selfie && <MirrorActions preview={preview} generating={generating} dirty={dirty} itemCount={itemCount} onGenerate={onGenerate} looks={looks} onPickLook={onPickLook} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} data-testid="selfie-upload-input" />
      <CameraDialog open={camOpen} onOpenChange={setCamOpen} onCapture={onSelfie} />
    </section>
  );
};
