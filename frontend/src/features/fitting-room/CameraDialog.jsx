import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export const CameraDialog = ({ open, onOpenChange, onCapture }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let stream;
    setError("");
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: 1280, height: 960 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera unavailable. Allow camera access or upload a photo instead."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [open]);

  const capture = () => {
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    onCapture(c.toDataURL("image/jpeg", 0.9));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fr-panel max-w-xl border-[#8f8f8f] bg-[#ffffff] text-[#000000]" data-testid="camera-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Strike a pose</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-[#d0021b]" data-testid="camera-error">{error}</p>
        ) : (
          <div className="relative overflow-hidden rounded-none border border-[#8f8f8f]">
            <video ref={videoRef} autoPlay playsInline muted className="aspect-[4/3] w-full -scale-x-100 bg-black object-cover" data-testid="camera-video" />
            <div className="pointer-events-none absolute inset-6 rounded-[50%] border border-dashed border-[#000000]/50" />
          </div>
        )}
        <button onClick={capture} disabled={!!error} className="fr-btn-primary w-full" data-testid="camera-capture-button">
          <Camera className="h-4 w-4" /> Capture selfie
        </button>
      </DialogContent>
    </Dialog>
  );
};
