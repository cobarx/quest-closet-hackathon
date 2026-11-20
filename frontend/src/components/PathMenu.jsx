import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Hammer, MessageCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";

export const PATHS = [
  { to: "/build", title: "flow_a_title", badge: "flow_a_badge", icon: Hammer, id: "build" },
  { to: "/interview", title: "flow_b_title", badge: "flow_b_badge", icon: MessageCircle, id: "interview" },
];

// Desktop: opens on hover (and on click/keyboard for touch & accessibility).
export const PathMenu = () => {
  const { t } = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef();
  const wrap = useRef();
  const active = PATHS.some((p) => pathname.startsWith(p.to));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const enter = () => { clearTimeout(closeTimer.current); setOpen(true); };
  const leave = () => { closeTimer.current = setTimeout(() => setOpen(false), 150); };

  return (
    <div ref={wrap} className="relative" onMouseEnter={enter} onMouseLeave={leave} data-testid="nav-path-menu">
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        data-testid="nav-path-menu-trigger"
        className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${active || open ? "text-amber-400" : "text-stone-300 hover:text-amber-200"}`}>
        {t("choose_path")}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`absolute left-0 top-full z-50 pt-2 transition-all duration-150 ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
        <div className="w-80 overflow-hidden rounded-xl border border-stone-800 bg-stone-950/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl" role="menu" data-testid="nav-path-menu-panel">
          {PATHS.map(({ to, title, badge, icon: Icon, id }) => (
            <Link key={to} to={to} role="menuitem" data-testid={`nav-path-${id}-link`}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-stone-800/70 ${pathname.startsWith(to) ? "bg-stone-800/50" : ""}`}>
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-400"><Icon size={16} /></span>
              <span>
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">{t(badge)}</span>
                <span className="block text-sm font-medium text-amber-50">{t(title)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
