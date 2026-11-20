import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorText, outfitKey } from "../api";

const AUTO_DELAY_MS = 1200;

export const useTryOn = (api, equipped, styleNote) => {
  const [selfie, setSelfieState] = useState(null);
  const [preview, setPreview] = useState(null);
  const [renderedKey, setRenderedKey] = useState(null);
  const [looks, setLooks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const reqId = useRef(0);
  const timerRef = useRef(null);
  const outfitRef = useRef({ equipped, styleNote });
  outfitRef.current = { equipped, styleNote };
  const selfieRef = useRef(null);
  const profileRef = useRef(null);

  const cancel = useCallback(() => {
    reqId.current += 1;
    setGenerating(false);
  }, []);

  const generate = useCallback(async (items, note) => {
    if (!selfieRef.current) return toast.error("Take or upload a selfie first");
    clearTimeout(timerRef.current);
    const id = ++reqId.current;
    setGenerating(true);
    try {
      const { image } = await api.tryOn({
        selfie: selfieRef.current, item_ids: Object.values(items).map((i) => i.id), style_note: note, profile: profileRef.current,
      });
      if (id !== reqId.current) return;
      setPreview(image);
      setRenderedKey(outfitKey(items, note));
      setLooks((l) => [{ id: `look-${id}`, image, items, note }, ...l].slice(0, 8));
    } catch (e) {
      if (id === reqId.current) toast.error(errorText(e, "Preview failed, please try again"));
    } finally {
      if (id === reqId.current) setGenerating(false);
    }
  }, [api]);

  const setSelfie = useCallback((face) => {
    cancel();
    selfieRef.current = face;
    setSelfieState(face);
    setPreview(null);
    setLooks([]);
    setRenderedKey(null);
    setEpoch((e) => e + 1);
  }, [cancel]);

  const setProfile = useCallback((profile) => {
    profileRef.current = profile;
    cancel();
    setRenderedKey(null);
    setEpoch((e) => e + 1);
  }, [cancel]);

  const showLook = useCallback((look) => {
    cancel();
    setPreview(look.image);
    setRenderedKey(outfitKey(look.items, look.note));
  }, [cancel]);

  const key = outfitKey(equipped, styleNote);
  const hasItems = Object.keys(equipped).length > 0;

  useEffect(() => {
    if (!selfie || key === renderedKey) return undefined;
    cancel();
    if (!hasItems) {
      setPreview(null);
      setRenderedKey(key);
      return undefined;
    }
    timerRef.current = setTimeout(() => generate(outfitRef.current.equipped, outfitRef.current.styleNote), AUTO_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [selfie, key, renderedKey, hasItems, epoch, cancel, generate]);

  const regenerate = useCallback(() => generate(equipped, styleNote), [generate, equipped, styleNote]);

  return { selfie, preview, looks, generating, dirty: !!selfie && key !== renderedKey, setSelfie, setProfile, showLook, regenerate, selfieRef };
};
