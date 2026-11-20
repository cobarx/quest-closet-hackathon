import { useRef, useState } from "react";
import { Camera, Upload, Sparkles, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { CameraDialog } from "./CameraDialog";
import { MirrorLoading } from "./MirrorLoading";

const EmptyMirror = ({ onCamera, onUpload }) => (
  <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
    <div className="fr-mirror-sigil"><Camera className="h-8 w-8 text-[#000000]" /></div>
    <div>
      <p className="font-display text-xl text-[#000000]">Step into the mirror</p>
      <p className="mt-2 text-sm text-[#555555]">Take a selfie or upload a photo. We'll build your model and dress it in any gear you pick.</p>
    </div>
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <button onClick={onCamera} className="fr-btn-primary whitespace-nowrap sm:flex-1" data-testid="selfie-webcam-trigger"><Camera className="h-4 w-4" /> Take selfie</button>
      <button onClick={onUpload} className="fr-btn-ghost whitespace-nowrap sm:flex-1" data-testid="selfie-upload-trigger"><Upload className="h-4 w-4" /> Upload photo</button>
    </div>
  </div>
);

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const FIT_LABELS = { men: "Men", women: "Women", other: "All fits" };
const chip = "rounded-full bg-white/90 px-3 py-1 text-xs";

const readImageFile = (file, onLoad) => {
  if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
  if (file.size > MAX_UPLOAD_BYTES) return toast.error("That image is over 15 MB. Try a smaller one.");
  const reader = new FileReader();
  reader.onload = () => onLoad(reader.result);
  reader.readAsDataURL(file);
};

const MirrorHeader = ({ selfie, profile, onEditProfile, onNewPhoto }) => (
  <div className="flex items-center justify-between border-b border-[#8f8f8f] px-5 py-3">
    <span className="fr-eyebrow">The Mirror</span>
    {selfie && (
      <div className="flex items-center gap-3">
        {profile && (
          <button onClick={onEditProfile} className="rounded-full border border-[#8f8f8f] px-2.5 py-0.5 text-[11px] text-[#555555] transition-colors hover:border-[#000000] hover:text-[#555555]" data-testid="profile-chip">
            {profile.height_cm} cm · {profile.weight_kg} kg · {FIT_LABELS[profile.gender]}
          </button>
        )}
        <button onClick={onNewPhoto} className="text-xs text-[#555555] transition-colors hover:text-[#555555]" data-testid="selfie-retake-button">New photo</button>
      </div>
    )}
  </div>
);

const CompareButton = ({ onPeek }) => (
  <button onPointerDown={() => onPeek(true)} onPointerUp={() => onPeek(false)} onPointerLeave={() => onPeek(false)}
    className={`absolute right-3 top-3 flex items-center gap-1.5 ${chip} text-[#000000] transition-colors hover:text-[#555555]`} data-testid="mirror-compare-button">
    <Eye className="h-3.5 w-3.5" /> Hold for original
  </button>
);

const MirrorStage = ({ selfie, preview, generating, itemCount, onCamera, onUpload }) => {
  const [peek, setPeek] = useState(false);
  const shown = peek || !preview ? selfie : preview;
  const idle = selfie && !generating;
  return (
    <div className="relative aspect-[4/5] bg-[#f2f2f2]">
      {selfie
        ? <img src={shown} alt="Your try-on preview" className="fr-fade-in h-full w-full object-contain" data-testid="virtual-tryon-preview-image" key={shown.slice(-40)} />
        : <EmptyMirror onCamera={onCamera} onUpload={onUpload} />}
      {generating && <MirrorLoading />}
      {idle && preview && !itemCount && <span className={`absolute left-3 top-3 ${chip} text-[#555555]`} data-testid="mirror-base-label">Your base model</span>}
      {generating && !preview && <span className={`absolute left-3 top-3 ${chip} text-[#555555]`} data-testid="mirror-building-label">Building your full-body model</span>}
      {idle && preview && <CompareButton onPeek={setPeek} />}
    </div>
  );
};

const generateLabel = ({ generating, preview, dirty, itemCount }) => {
  if (generating) return "Conjuring your look...";
  if (preview) return dirty ? "Update preview" : itemCount ? "Regenerate" : "Regenerate base model";
  return itemCount ? `Try on ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Build my base model";
};

const MirrorActions = ({ preview, generating, dirty, itemCount, onGenerate, looks, onPickLook }) => (
  <div className="space-y-3 p-4">
    <button onClick={onGenerate} disabled={generating} className={`fr-btn-primary w-full ${dirty ? "fr-pulse" : ""}`} data-testid="generate-tryon-button">
      {preview ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      {generateLabel({ generating, preview, dirty, itemCount })}
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

export const SelfieMirror = ({ profile, onEditProfile, selfie, onSelfie, preview, generating, onGenerate, dirty, looks, onPickLook, itemCount }) => {
  const [camOpen, setCamOpen] = useState(false);
  const fileRef = useRef(null);
  const openFile = () => fileRef.current?.click();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) readImageFile(file, onSelfie);
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
