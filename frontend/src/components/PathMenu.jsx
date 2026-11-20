import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Hammer, MessageCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";

export const PATHS = [
  { to: "/build", title: "flow_a_title", badge: "flow_a_badge", icon: Hammer, id: "build" },
  { to: "/interview", title: "flow_b_title", badge: "flow_b_badge", icon: MessageCircle, id: "interview" },
];

// Opens on mouse hover; on touch a tap toggles it. Clicking while hovered keeps it open
// (a hover-then-click used to close it again). Closes on route change, outside click, Escape.
export const useHoverMenu = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const timer = useRef();
  const ref = useRef();
  const lastPointer = useRef("mouse");

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onPointerEnter = useCallback((e) => {
    lastPointer.current = e.pointerType;
    if (e.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    setOpen(true);
  }, []);
  const onPointerLeave = useCallback((e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 200);
  }, []);
  const onPointerDown = useCallback((e) => { lastPointer.current = e.pointerType; }, []);
  const onTriggerClick = useCallback(() => {
    if (lastPointer.current === "mouse") setOpen(true);
    else setOpen((o) => !o);
  }, []);

  return { open, setOpen, ref, wrapperProps: { onPointerEnter, onPointerLeave }, triggerProps: { onPointerDown, onClick: onTriggerClick } };
};

export const PathMenu = () => {
  const { t } = useLang();
  const { pathname } = useLocation();
  const { open, ref, wrapperProps, triggerProps } = useHoverMenu();
  const active = PATHS.some((p) => pathname.startsWith(p.to));

  return (
    <div ref={ref} className="relative" {...wrapperProps} data-testid="nav-path-menu">
      <button type="button" aria-haspopup="true" aria-expanded={open} {...triggerProps}
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
