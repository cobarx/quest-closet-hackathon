import { useCallback, useRef, useState } from "react";
import { errorText } from "../api";

let seq = 0;
const nextId = () => `msg-${++seq}`;

// Rendered through i18n so it follows the language toggle.
const GREETING = { id: "msg-greeting", role: "assistant", i18nKey: "chat.greeting", content: "" };

// Runs stylist turns one at a time so voice/text commands apply in the order they were said.
export const useStylist = (api, getContext, onResult, awayText = "The Quartermaster is away. Try again.") => {
  const [messages, setMessages] = useState([GREETING]);
  const [thinking, setThinking] = useState(false);
  const queue = useRef([]);
  const busy = useRef(false);
  const history = useRef([]);
  const handlers = useRef({ getContext, onResult, awayText });
  handlers.current = { getContext, onResult, awayText };

  const run = useCallback(async (msg) => {
    busy.current = true;
    setThinking(true);
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, queued: false } : x)));
    try {
      const res = await api.assistant({ message: msg.content, history: history.current.slice(-10), ...handlers.current.getContext() });
      history.current.push({ role: "user", content: msg.content }, { role: "assistant", content: res.reply });
      setMessages((m) => [...m, { id: nextId(), role: "assistant", content: res.reply, voice: msg.voice, noMatch: !!res.no_match,
        items: [...new Set([...res.equip, ...res.highlight])] }]);
      handlers.current.onResult(res);
    } catch (e) {
      setMessages((m) => [...m, { id: nextId(), role: "assistant", content: errorText(e, handlers.current.awayText), error: true, voice: msg.voice }]);
    }
    const next = queue.current.shift();
    if (next) return run(next);
    busy.current = false;
    setThinking(false);
  }, [api]);

  const send = useCallback((text, { voice = false } = {}) => {
    const msg = { id: nextId(), role: "user", content: text, queued: busy.current, voice };
    setMessages((m) => [...m, msg]);
    if (busy.current) queue.current.push(msg);
    else run(msg);
  }, [run]);

  return { messages, thinking, send };
};
