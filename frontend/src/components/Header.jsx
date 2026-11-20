import { useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Show, UserButton, useAuth } from "@clerk/react";
import { ShoppingBag, Flame, ChevronDown } from "lucide-react";
import { useLang, money } from "@/lib/i18n";
import { useApp } from "@/lib/appState";
import { PathMenu, PATHS, useHoverMenu } from "@/components/PathMenu";

export const LangToggle = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border border-amber-500/40 p-0.5 text-xs font-semibold" data-testid="language-toggle-btn">
      {["fr", "en"].map((l) => (
        <button key={l} data-testid={`lang-${l}-btn`} onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${lang === l ? "bg-amber-500 text-stone-950" : "text-stone-300 hover:text-amber-300"}`}>
          {l}
        </button>
      ))}
    </div>
  );
};

// The Shop page (/shop) still exists but is no longer linked from the nav; "Choose your path" replaces it.
const NAV = [["/events", "nav_events"], ["/looks", "nav_looks"], ["/orders", "nav_orders"], ["/profile", "nav_profile"]];

const MPANEL_W = 288;
const navCls = ({ isActive }) => `rounded-md px-3 py-2 text-sm transition-colors ${isActive ? "text-amber-400" : "text-stone-300 hover:text-amber-200"}`;
const mNavCls = ({ isActive }) => `whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${isActive ? "bg-stone-800 text-amber-400" : "text-stone-300"}`;

export const Header = () => {
  const { t, lang } = useLang();
  const { cart, byId, setCartOpen } = useApp();
  const { isSignedIn } = useAuth();
  const { pathname } = useLocation();
  const { open: mPaths, ref: mRef, wrapperProps: mHover, triggerProps: mTrigger } = useHoverMenu();
  const mTrigRef = useRef();
  const [mLeft, setMLeft] = useState(0);
  // Compact nav scrolls sideways (which would clip a dropdown), so the panel lives outside it
  // and is aligned under the trigger, clamped to stay on screen.
  useLayoutEffect(() => {
    if (!mPaths || !mTrigRef.current || !mRef.current) return;
    const tr = mTrigRef.current.getBoundingClientRect(), wr = mRef.current.getBoundingClientRect();
    setMLeft(Math.max(8, Math.min(tr.left - wr.left, wr.width - MPANEL_W - 8)));
  }, [mPaths, mRef]);
  const nav = NAV.filter(([to]) => isSignedIn || to !== "/orders");
  const [first, ...rest] = nav;
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + (byId[i.product_id]?.price || 0) * i.qty, 0);
  const pathActive = PATHS.some((p) => pathname.startsWith(p.to));
  return (
    <header className="sticky top-0 z-50 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" data-testid="brand-home-link">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-amber-500 to-orange-700 text-stone-950">
            <Flame size={18} />
          </span>
          <span className="hidden font-display text-base font-bold tracking-wide text-amber-50 sm:block">{t("brand")}</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <NavLink to={first[0]} data-testid={`nav-${first[1]}`} className={navCls}>{t(first[1])}</NavLink>
          <PathMenu />
          {rest.map(([to, k]) => (
            <NavLink key={to} to={to} data-testid={`nav-${k}`} className={navCls}>{t(k)}</NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LangToggle />
            <button onClick={() => setCartOpen(true)} data-testid="cart-drawer-trigger"
              className="flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-stone-100 transition-colors hover:border-amber-500/60">
              <ShoppingBag size={16} className="text-amber-400" />
              <span data-testid="cart-count">{count}</span>
              <span className="hidden text-stone-400 sm:inline" data-testid="cart-total-header">{money(total, lang)}</span>
            </button>
          <Show when="signed-in"><UserButton /></Show>
          <Show when="signed-out">
            <Link to="/sign-in" data-testid="header-signin-link" className="text-sm text-stone-300 hover:text-amber-300">{t("signin")}</Link>
          </Show>
        </div>
      </div>
        <div ref={mRef} className="relative lg:hidden">
        <nav className="flex gap-1 overflow-x-auto border-t border-stone-800/60 px-3 py-1.5 lg:hidden" onScroll={() => mPaths && mTrigger.onClose()}>
          <NavLink to={first[0]} data-testid={`mnav-${first[1]}`} className={mNavCls}>{t(first[1])}</NavLink>
          <button ref={mTrigRef} type="button" onPointerDown={mTrigger.onPointerDown} onClick={mTrigger.onClick} {...mHover} aria-expanded={mPaths} data-testid="mnav-path-menu-trigger"
            className={`flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${pathActive || mPaths ? "bg-stone-800 text-amber-400" : "text-stone-300"}`}>
            {t("choose_path")}<ChevronDown size={12} className={`transition-transform ${mPaths ? "rotate-180" : ""}`} />
          </button>
          {rest.map(([to, k]) => (
            <NavLink key={to} to={to} data-testid={`mnav-${k}`} className={mNavCls}>{t(k)}</NavLink>
          ))}
        </nav>
        {mPaths && (
          <div {...mHover} className="absolute top-full z-50 pt-1" style={{ left: mLeft, width: MPANEL_W }}>
            <div className="flex flex-col gap-0.5 rounded-xl border border-stone-800 bg-stone-950/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl" role="menu" data-testid="mnav-path-menu-panel">
              {PATHS.map(({ to, title, icon: Icon, id }) => (
                <Link key={to} to={to} role="menuitem" data-testid={`mnav-path-${id}-link`}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-stone-800/70 ${pathname.startsWith(to) ? "bg-stone-800 text-amber-400" : "text-stone-200"}`}>
                  <Icon size={15} className="shrink-0 text-amber-400" />{t(title)}
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>
    </header>
  );
};
