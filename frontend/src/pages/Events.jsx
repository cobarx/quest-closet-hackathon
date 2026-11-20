import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Car, ExternalLink, Loader2, MapPin, RefreshCw, Repeat, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/EventPicker";
import { useLang } from "@/lib/i18n";
import { useApp, API } from "@/lib/appState";

export default function Events() {
  const { t, lang } = useLang();
  const { api, toast } = useApp();
  const navigate = useNavigate();
  const [events, setEvents] = useEvents();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const h = setInterval(async () => {
      const st = (await axios.get(`${API}/events/refresh`)).data;
      if (st.running) return;
      setLoading(false);
      if (st.error) toast.error(t("error"));
      setEvents((await axios.get(`${API}/events`)).data);
    }, 5000);
    return () => clearInterval(h);
  }, [loading, setEvents, toast, t]);

  const refresh = async () => {
    try {
      await api("post", "/events/refresh");
      setLoading(true);
    } catch { toast.error(t("error")); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-amber-50 sm:text-5xl">{t("ev_title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-400">{t("ev_sub")}</p>
        </div>
        <Button onClick={refresh} disabled={loading} variant="outline" className="rounded-full border-amber-500/50" data-testid="events-ai-refresh-btn">
          {loading ? <Loader2 className="mr-2 animate-spin" size={16} /> : <RefreshCw className="mr-2" size={16} />}
          {loading ? t("ev_refreshing") : t("ev_refresh")}
        </Button>
      </div>
      <p className="mt-4 text-xs text-stone-500">{t("ev_disclaimer")}</p>
      {events.length === 0 && <p className="mt-10 text-stone-400" data-testid="events-empty">{t("ev_empty")}</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e, i) => (
          <article key={e.id} className="rise flex flex-col rounded-xl border border-stone-800 leather p-5" style={{ animationDelay: `${i * 40}ms` }} data-testid={`event-card-${e.id}`}>
            <h3 className="text-xl font-semibold text-amber-50">
              {e.url ? (
                <a href={e.url} target="_blank" rel="noreferrer" className="group/link inline-flex items-start gap-1.5 transition-colors hover:text-amber-300" data-testid={`event-name-${e.id}`}>
                  {e.name}<ExternalLink size={14} className="mt-1.5 shrink-0 opacity-60 group-hover/link:opacity-100" />
                </a>
              ) : <span data-testid={`event-name-${e.id}`}>{e.name}</span>}
            </h3>
            {e[`genre_${lang}`] && <p className="mt-1.5 text-sm font-medium text-blue-200" data-testid={`event-genre-${e.id}`}>{e[`genre_${lang}`]}</p>}
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-stone-300" data-testid={`event-location-${e.id}`}>
              <MapPin size={14} className="mt-0.5 shrink-0 text-amber-500" />{e.location}
            </p>
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-amber-300" data-testid={`event-datetime-${e.id}`}>
              <CalendarClock size={14} className="mt-0.5 shrink-0 text-amber-500" />{e[`dates_text_${lang}`] || e.start_date}
            </p>
            {e[`recurrence_${lang}`] && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-stone-300" data-testid={`event-recurrence-${e.id}`}>
                <Repeat size={14} className="mt-0.5 shrink-0 text-amber-500" />{e[`recurrence_${lang}`]}
              </p>
            )}
            {e[`age_range_${lang}`] && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-stone-300" data-testid={`event-age-${e.id}`}>
                <Users size={14} className="mt-0.5 shrink-0 text-amber-500" />{e[`age_range_${lang}`]}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-400">
              <span className="flex items-center gap-1"><Car size={14} />{e.distance_km} km · {e.drive_time} {t("ev_from_mtl")}</span>
            </div>
            <p className="mt-3 flex-1 text-sm text-stone-400">{e[`description_${lang}`]}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-800 pt-3 text-xs">
              <span className="text-stone-500">{t("ev_checked")} {new Date(e.last_checked).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA")}</span>
              <button onClick={() => navigate(`/build?event=${e.id}`)} className="ml-auto rounded-full bg-amber-500 px-3 py-1 font-semibold text-stone-950" data-testid={`event-attach-${e.id}`}>{t("ev_attach")}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
