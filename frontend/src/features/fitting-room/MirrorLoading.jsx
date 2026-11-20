import { useEffect, useState } from "react";

const STAGES = [
  "Reading your features...",
  "Fitting the gear to your frame...",
  "Buckling straps and clasps...",
  "Painting light and shadow...",
  "Final touches on your look...",
];

export const MirrorLoading = () => {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-white/90 backdrop-blur-sm" data-testid="tryon-loading-state">
      <div className="fr-rune" />
      <p key={stage} className="fr-fade-in px-6 text-center font-display text-base text-[#000000]">{STAGES[stage]}</p>
      <div className="h-[2px] w-40 overflow-hidden bg-[#8f8f8f]">
        <div className="h-full bg-[#000000] transition-[width] duration-[3500ms] ease-linear" style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} />
      </div>
    </div>
  );
};
