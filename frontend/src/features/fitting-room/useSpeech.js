import { useEffect, useRef, useState } from "react";

const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export const useSpeech = (onResult, lang = "en") => {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const wantRef = useRef(false);
  const cbRef = useRef(onResult);
  cbRef.current = onResult;
  const langRef = useRef(lang);
  langRef.current = lang;
  const pausedRef = useRef(false); // true while the stylist is speaking, so the mic doesn't hear it

  const start = () => {
    const rec = new Recognition();
    rec.lang = langRef.current === "fr" ? "fr-CA" : "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const text = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal && text) cbRef.current(text);
      }
    };
    rec.onend = () => {
      if (recRef.current !== rec || pausedRef.current) return;
      if (wantRef.current) rec.start(); else setListening(false);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setListening(false);
      }
    };
    recRef.current = rec;
    rec.start();
  };

  const toggle = () => {
    if (wantRef.current) {
      wantRef.current = false;
      recRef.current?.stop();
      return setListening(false);
    }
    wantRef.current = true;
    setListening(true);
    start();
  };

  // Read a reply aloud (used for voice requests), pausing recognition until it finishes.
  const say = (text) => {
    const synth = typeof window !== "undefined" && window.speechSynthesis;
    if (!synth || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langRef.current === "fr" ? "fr-CA" : "en-US";
    pausedRef.current = true;
    recRef.current?.stop();
    u.onend = u.onerror = () => {
      pausedRef.current = false;
      if (wantRef.current) start();
    };
    synth.cancel();
    synth.speak(u);
  };

  useEffect(() => () => { wantRef.current = false; recRef.current?.stop(); window.speechSynthesis?.cancel(); }, []);

  return { supported: Boolean(Recognition), listening, toggle, say };
};
