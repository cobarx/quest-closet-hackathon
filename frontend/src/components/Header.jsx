import { useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Show, UserButton, useAuth } from "@clerk/react";
import { ShoppingBag, Flame, ChevronDown, Sparkles, Swords } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLang, money } from "@/lib/i18n";
import { useApp } from "@/lib/appState";

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

const PathMenu = ({ mobile }) => {
  const { t } = useLang();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = pathname === "/build" || pathname === "/interview";
  const p = mobile ? "mnav" : "nav";
  const [open, setOpen] = useState(false);
  const timer = useRef();
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hover = !canHover ? {} : {
    onMouseEnter: () => { clearTimeout(timer.current); setOpen(true); },
    onMouseLeave: () => { timer.current = setTimeout(() => setOpen(false), 150); },
  };
  const overTrigger = useRef(false);
  const triggerHover = !canHover ? {} : {
    onPointerEnter: () => { overTrigger.current = true; },
    onPointerLeave: () => { overTrigger.current = false; },
  };
  return (
    <DropdownMenu open={open} onOpenChange={(v) => { if (!v && overTrigger.current) return; setOpen(v); }} modal={false}>
      <DropdownMenuTrigger {...hover} {...triggerHover} onPointerDown={(e) => { if (canHover && e.pointerType === "mouse") { e.preventDefault(); setOpen(true); } }} data-testid={`${p}-choose-path-trigger`}
        className={`flex items-center gap-1 whitespace-nowrap rounded-md outline-none transition-colors ${mobile ? "px-3 py-1.5 text-xs" : "px-2.5 py-2 text-sm"} ${active ? "text-amber-400" : "text-stone-300 hover:text-amber-200"}`}>
        {t("choose_path")} <ChevronDown size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent {...hover} align="start" sideOffset={4} className="border-stone-800 bg-stone-950">
        <DropdownMenuItem onSelect={() => navigate("/build")} data-testid={`${p}-path-a-item`} className="cursor-pointer gap-2">
          <Swords size={14} className="text-amber-400" />{t("flow_a_title")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/interview")} data-testid={`${p}-path-b-item`} className="cursor-pointer gap-2">
          <Sparkles size={14} className="text-amber-400" />{t("flow_b_title")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NAV = [["/events", "nav_events"], ["/shop", "nav_shop"], ["/looks", "nav_looks"], ["/orders", "nav_orders"], ["/profile", "nav_profile"]];

export const Header = () => {
  const { t, lang } = useLang();
  const { cart, byId, setCartOpen } = useApp();
  const { isSignedIn } = useAuth();
  const nav = NAV.filter(([to]) => isSignedIn || to !== "/orders");
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + (byId[i.product_id]?.price || 0) * i.qty, 0);
  return (
    <header className="sticky top-0 z-50 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" data-testid="brand-home-link">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-amber-500 to-orange-700 text-stone-950">
            <Flame size={18} />
          </span>
          <span className="hidden whitespace-nowrap font-display text-base font-bold tracking-wide text-amber-50 sm:block">{t("brand")}</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
            <PathMenu />
            {nav.map(([to, k]) => (
              <NavLink key={to} to={to} data-testid={`nav-${k}`}
                className={({ isActive }) => `whitespace-nowrap rounded-md px-2.5 py-2 text-sm transition-colors ${isActive ? "text-amber-400" : "text-stone-300 hover:text-amber-200"}`}>
                {t(k)}
              </NavLink>
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
            <Link to="/sign-in" data-testid="header-signin-link" className="whitespace-nowrap text-sm text-stone-300 hover:text-amber-300">{t("signin")}</Link>
          </Show>
        </div>
      </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-stone-800/60 px-3 py-1.5 lg:hidden">
          <PathMenu mobile />
          {nav.map(([to, k]) => (
            <NavLink key={to} to={to} data-testid={`mnav-${k}`}
              className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${isActive ? "bg-stone-800 text-amber-400" : "text-stone-300"}`}>
              {t(k)}
            </NavLink>
          ))}
        </nav>
    </header>
  );
};
