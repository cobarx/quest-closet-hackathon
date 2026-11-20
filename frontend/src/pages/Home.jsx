import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { useUser } from "@clerk/react";
import { useLang } from "@/lib/i18n";
import { useEvents } from "@/components/EventPicker";

const CARDS = [
  { to: "/build", key: "a", img: "https://images.unsplash.com/photo-1686747517763-f9d694bda04d?auto=format&fit=crop&w=1200&q=80" },
  { to: "/interview", key: "b", img: "https://images.pexels.com/photos/40452766/pexels-photo-40452766.jpeg?auto=compress&cs=tinysrgb&w=1200" },
];

export default function Home() {
  const { t, lang } = useLang();
  const { user } = useUser();
  const [events] = useEvents();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">{t("welcome")}{user?.firstName ? `, ${user.firstName}` : ""}</p>
      <h1 className="mt-3 text-4xl font-bold text-amber-50 sm:text-5xl">{t("choose_path")}</h1>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {CARDS.map((c, i) => (
          <Link key={c.key} to={c.to} data-testid={`flow-${c.key}-start-btn`}
            className="rise group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-2xl border border-stone-800 transition-[border-color] hover:border-amber-500/70"
            style={{ animationDelay: `${i * 90}ms` }}>
            <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent" />
            <div className="relative p-6 sm:p-8">
              <span className="rounded-full border border-amber-500/40 bg-stone-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                {t(`flow_${c.key}_badge`)}
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-amber-50 sm:text-3xl">{t(`flow_${c.key}_title`)}</h2>
              <p className="mt-2 max-w-md text-sm text-stone-300">{t(`flow_${c.key}_desc`)}</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950">
                {t("start")} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-14 flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-amber-100">{t("upcoming_events")}</h2>
        <Link to="/events" className="text-sm text-amber-400 hover:underline" data-testid="home-all-events-link">{t("nav_events")} →</Link>
      </div>
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
        {events.slice(0, 6).map((e) => (
          <Link key={e.id} to="/events" className="min-w-[240px] rounded-xl border border-stone-800 bg-stone-900 p-4 hover:border-stone-600" data-testid={`home-event-${e.id}`}>
            <p className="font-semibold text-stone-100">{e.name}</p>
            {e[`genre_${lang}`] && <p className="mt-1 text-xs text-blue-200">{e[`genre_${lang}`]}</p>}
            {e[`age_range_${lang}`] && <p className="mt-1 text-xs text-stone-300" data-testid={`home-event-age-${e.id}`}>{e[`age_range_${lang}`]}</p>}
            <p className="mt-1 flex items-center gap-1 text-xs text-stone-400"><MapPin size={12} />{e.location} · {e.drive_time}</p>
            <p className="mt-1 text-xs text-amber-400">{e[`dates_text_${lang}`] || e.start_date}</p>
            {e[`recurrence_${lang}`] && <p className="mt-1 text-xs text-stone-400">{e[`recurrence_${lang}`]}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
