import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useStore } from "../store/StoreContext";

const dayMonth = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? ["", ""] : [d.getDate(), d.toLocaleString("en", { month: "short" }).toUpperCase()];
};

export const EventCard = ({ event }) => {
  const [day, month] = dayMonth(event.start_date);
  return (
    <article className="flex gap-4 bg-white p-5" data-testid={`event-card-${event.id}`}>
      <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-black py-2 text-white">
        <span className="text-2xl font-black">{day}</span><span className="text-[11px] font-bold">{month}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-extrabold uppercase">{event.name}</p>
        <p className="mt-0.5 text-xs font-bold uppercase text-[#555555]">{event.location}{event.drive_time ? ` · ${event.drive_time} drive` : ""}</p>
        <p className="mt-1 text-xs">{event.dates_text}</p>
        {event.recurrence && <p className="text-xs text-[#555555]">{event.recurrence}</p>}
        <p className="mt-2 line-clamp-2 text-xs text-[#333333]">{event.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase">
          {event.genre && <span className="border border-black px-1.5 py-0.5">{event.genre}</span>}
          {event.age_range && <span className="border border-black px-1.5 py-0.5">{event.age_range}</span>}
          {event.url && <a href={event.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline" data-testid={`event-link-${event.id}`}>Website <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
    </article>
  );
};

export default function EventsPage() {
  const { api } = useStore();
  const [events, setEvents] = useState(null);
  const [state, setState] = useState({ running: false, error: false });
  const timer = useRef(null);

  const load = useCallback(() => api("get", "/events").then(setEvents).catch(() => setEvents([])), [api]);
  const poll = useCallback(() => {
    timer.current = setTimeout(async () => {
      const s = await api("get", "/events/refresh").catch(() => ({ running: false, error: true }));
      setState(s);
      if (s.running) poll(); else load();
    }, 4000);
  }, [api, load]);
  const refresh = async () => {
    setState(await api("post", "/events/refresh"));
    poll();
  };

  useEffect(() => {
    load();
    api("get", "/events/refresh").then((s) => { setState(s); if (s.running) poll(); }).catch(() => {});
    return () => clearTimeout(timer.current);
  }, [api, load, poll]);

  return (
    <div className="px-4 py-8 sm:px-8" data-testid="events-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase sm:text-5xl">Events</h1>
          <p className="mt-1 text-xs font-bold uppercase text-[#555555]">LARP events within about 4 hours of Montreal, found by AI web search</p>
        </div>
        <button onClick={refresh} disabled={state.running} className="fr-btn-ghost" data-testid="events-refresh-button">
          <RefreshCw className={`h-4 w-4 ${state.running ? "animate-spin" : ""}`} />{state.running ? "Searching the web…" : "Refresh events"}
        </button>
      </div>
      {state.error && <p className="mt-4 text-xs font-bold uppercase text-[#d0021b]" data-testid="events-error">The last search failed. Try again.</p>}
      <div className="mt-6">
        {events === null ? null : events.length ? (
          <div className="grid gap-px border border-black bg-black md:grid-cols-2 xl:grid-cols-3" data-testid="events-grid">
            {events.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <p className="py-16 text-center text-sm uppercase text-[#555555]" data-testid="events-empty">
            {state.running ? "Searching for upcoming events. This takes about a minute." : "No upcoming events yet. Press Refresh events."}
          </p>
        )}
      </div>
    </div>
  );
}
