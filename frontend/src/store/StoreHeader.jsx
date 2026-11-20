import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AppUserButton, AuthShow } from "../components/auth/AppAuth";
import { Search, ShoppingBag } from "lucide-react";
import { CATEGORIES } from "./catalog";
import { useStore } from "./StoreContext";
import { LangToggle, useI18n } from "../i18n";

const TopLink = ({ to, children, testId }) => (
  <NavLink to={to} data-testid={testId}
    className={({ isActive }) => `text-sm font-bold uppercase transition-colors ${isActive ? "text-black underline underline-offset-4" : "text-[#555555] hover:text-black"}`}>
    {children}
  </NavLink>
);

const SearchBox = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { t } = useI18n();
  const submit = (e) => { e.preventDefault(); navigate(`/shop/all?q=${encodeURIComponent(q.trim())}`); };
  return (
    <form onSubmit={submit} className="hidden w-64 items-center gap-3 border-x border-black px-4 md:flex xl:w-80">
      <Search className="h-4 w-4 shrink-0" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("nav.search").toUpperCase()} data-testid="nav-search-input"
        className="w-full bg-transparent text-sm font-semibold uppercase outline-none placeholder:text-black" />
    </form>
  );
};

const CategoryStrip = () => {
  const { t, term } = useI18n();
  return (
  <nav className="flex items-center gap-6 overflow-x-auto border-t border-black px-4 py-2.5 sm:px-8" data-testid="category-strip">
    <TopLink to="/shop/all" testId="tab-all">{t("nav.all")}</TopLink>
    {CATEGORIES.map((c) => (
      <NavLink key={c.id} to={`/shop/${c.slug}`} data-testid={`tab-${c.slug}`}
        className={({ isActive }) => `shrink-0 text-xs font-bold uppercase ${isActive ? "text-black underline underline-offset-4" : "text-[#555555] hover:text-black"}`}>
        {term("cat", c.id)}
      </NavLink>
    ))}
  </nav>
  );
};

export const StoreHeader = () => {
  const { cart, setCartOpen } = useStore();
  const { t } = useI18n();
  const count = cart.reduce((n, i) => n + i.qty, 0);
  return (
    <div className="sticky top-0 z-30 border-b border-black bg-white">
      <header className="flex h-14 items-stretch" data-testid="store-nav">
        <Link to="/" className="flex items-center px-4 text-xl font-black tracking-tight sm:px-8 sm:text-2xl" data-testid="store-logo">QUEST CLOSET</Link>
        <div className="hidden items-center gap-6 px-2 lg:flex">
          <TopLink to="/fitting-room" testId="nav-fitting-room">{t("nav.fittingRoom")}</TopLink>
          <TopLink to="/events" testId="nav-events">{t("nav.events")}</TopLink>
        </div>
        <div className="ml-auto flex items-stretch">
          <SearchBox />
          <div className="flex items-center gap-4 px-4 sm:px-8">
            <LangToggle />
            <Link to="/shop/all" className="md:hidden" aria-label="Search" data-testid="nav-search-mobile"><Search className="h-5 w-5" /></Link>
            <AuthShow when="signed-out" guestShows={false}>
              <Link to="/sign-in" className="text-sm font-bold uppercase" data-testid="nav-sign-in">{t("nav.login")}</Link>
            </AuthShow>
            <AuthShow when="signed-in" guestShows>
              <Link to="/orders" className="hidden text-sm font-bold uppercase sm:inline" data-testid="nav-orders">{t("nav.orders")}</Link>
              <AppUserButton />
            </AuthShow>
            <button onClick={() => setCartOpen(true)} className="flex items-center gap-1.5 text-sm font-bold uppercase" data-testid="nav-bag-button">
              <ShoppingBag className="h-5 w-5" /><span className="hidden sm:inline">{t("nav.bag")}</span> ({count})
            </button>
          </div>
        </div>
      </header>
      <div className="flex gap-6 border-t border-black px-4 py-2 lg:hidden">
        <TopLink to="/fitting-room" testId="mobile-nav-fitting-room">{t("nav.fittingRoom")}</TopLink>
        <TopLink to="/events" testId="mobile-nav-events">{t("nav.events")}</TopLink>
      </div>
      <CategoryStrip />
    </div>
  );
};

export const StoreFooter = () => {
  const { t, term } = useI18n();
  return (
  <footer className="mt-16 bg-black px-4 py-12 text-white sm:px-8" data-testid="store-footer">
    <p className="text-3xl font-black sm:text-5xl">QUEST CLOSET</p>
    <div className="mt-8 grid grid-cols-2 gap-6 text-xs font-bold uppercase md:grid-cols-4">
      <div className="flex flex-col gap-2"><span className="text-[#9a9a9a]">{t("footer.shop")}</span>{CATEGORIES.slice(0, 5).map((c) => <Link key={c.id} to={`/shop/${c.slug}`}>{term("cat", c.id)}</Link>)}</div>
      <div className="flex flex-col gap-2"><span className="text-[#9a9a9a]">{t("footer.more")}</span>{CATEGORIES.slice(5).map((c) => <Link key={c.id} to={`/shop/${c.slug}`}>{term("cat", c.id)}</Link>)}</div>
      <div className="flex flex-col gap-2"><span className="text-[#9a9a9a]">{t("footer.play")}</span><Link to="/fitting-room">{t("nav.fittingRoom")}</Link><Link to="/events">{t("footer.eventsNear")}</Link></div>
      <div className="flex flex-col gap-2"><span className="text-[#9a9a9a]">{t("footer.account")}</span><Link to="/orders">{t("footer.myOrders")}</Link><Link to="/sign-in">{t("nav.login")}</Link></div>
    </div>
  </footer>
  );
};
