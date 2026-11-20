import { useEffect, useRef, useState } from "react";

const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export const useSpeech = (onResult) => {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const wantRef = useRef(false);
  const cbRef = useRef(onResult);
  cbRef.current = onResult;

  const start = () => {
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const text = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal && text) cbRef.current(text);
      }
    };
    rec.onend = () => (wantRef.current ? rec.start() : setListening(false));
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

  useEffect(() => () => { wantRef.current = false; recRef.current?.stop(); }, []);

  return { supported: Boolean(Recognition), listening, toggle };
};
