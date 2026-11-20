import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { useSpeech } from "./useSpeech";
import { useI18n } from "../../i18n";

const PROMPTS = ["chat.p1", "chat.p2", "chat.p3", "chat.p4", "chat.p5"];

const Message = ({ msg, byId, onOpen }) => {
  const { t, pn } = useI18n();
  return (
  <div className={`fr-fade-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} data-testid={msg.noMatch ? "ai-stylist-no-match" : undefined}>
    <div className={`max-w-[88%] rounded-none px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-[#000000] text-white" : msg.error ? "border border-[#d0021b] bg-[#fff2f2] text-[#d0021b]" : "border border-[#8f8f8f] bg-[#ffffff] text-[#000000]"}`}>
      {msg.i18nKey ? t(msg.i18nKey) : msg.content}{msg.queued && <span className="ml-1 text-[10px] opacity-70">{t("chat.queued")}</span>}
      {msg.items?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {msg.items.map((id) => byId[id] && (
            <button key={id} onClick={() => onOpen(byId[id])} className="flex items-center gap-1.5 rounded-full border border-[#8f8f8f] bg-[#ffffff] py-0.5 pl-0.5 pr-2.5 text-[11px] text-[#000000] transition-colors hover:border-[#000000]" data-testid={`chat-item-chip-${id}`}>
              <img src={byId[id].image} alt="" className="h-5 w-5 rounded-full object-cover" />{pn(byId[id])} · ${byId[id].price}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
  );
};

export const StylistChat = ({ messages, onSend, thinking, byId, onOpen }) => {
  const [text, setText] = useState("");
  const listRef = useRef(null);
  const { t, lang } = useI18n();
  const speech = useSpeech((heard) => onSend(heard, { voice: true }), lang);
  const spoken = useRef(new Set());
  const { say } = speech;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Voice requests get a spoken answer, including "No items match your query."
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.voice && !spoken.current.has(last.id)) {
      spoken.current.add(last.id);
      say(last.content);
    }
  }, [messages, say]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <section className="fr-panel flex h-[640px] flex-col lg:h-[calc(100vh-7rem)]" data-testid="ai-stylist-panel">
      <div className="border-b border-[#8f8f8f] px-5 py-3">
        <span className="fr-eyebrow">{t("chat.title")}</span>
        <p className="mt-1 text-xs text-[#666666]">{t("chat.subtitle")}</p>
      </div>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" data-testid="ai-stylist-messages-list">
        {messages.map((m) => <Message key={m.id} msg={m} byId={byId} onOpen={onOpen} />)}
        {thinking && (
          <div className="flex gap-1.5 px-2 py-3" data-testid="ai-stylist-thinking">
            {[0, 1, 2].map((i) => <span key={i} className="fr-dot" style={{ animationDelay: `${i * 150}ms` }} />)}
          </div>
        )}
      </div>
      {speech.listening && (
        <p className="mx-4 mb-2 rounded-none border border-[#d0021b] bg-[#fff2f2] px-3 py-2 text-xs text-[#000000]" data-testid="voice-mode-banner">
          {t("chat.handsFree")}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {PROMPTS.map((p, i) => (
          <button key={p} onClick={() => onSend(t(p))} className="fr-chip text-[11px]" data-testid={`ai-quick-prompt-${i}`}>{t(p)}</button>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-[#8f8f8f] p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={speech.listening ? t("chat.listening") : t("chat.placeholder")}
          className="h-10 min-w-0 flex-1 rounded-none border border-[#8f8f8f] bg-[#f2f2f2] px-3 text-sm text-[#000000] outline-none transition-colors placeholder:text-[#666666] focus:border-[#000000]" data-testid="ai-stylist-input" />
        {speech.supported && (
          <button type="button" onClick={speech.toggle} aria-label={t("chat.voice")}
            className={`flex h-10 w-10 items-center justify-center rounded-none border transition-colors ${speech.listening ? "border-[#d0021b] bg-[#d0021b] text-white" : "border-[#8f8f8f] text-[#555555] hover:border-[#000000] hover:text-[#555555]"}`} data-testid="ai-stylist-mic-toggle">
            {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <button type="submit" disabled={!text.trim()} className="flex h-10 w-10 items-center justify-center rounded-none bg-[#000000] text-white transition-colors hover:bg-[#333333] disabled:opacity-40" data-testid="ai-stylist-send-button" aria-label={t("chat.send")}>
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
};
