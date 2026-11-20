import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, HERO, LOOKS } from "../store/catalog";
import { useStore } from "../store/StoreContext";
import { ProductCard } from "../store/ProductCard";
import { EventCard } from "./EventsPage";

const Hero = () => (
  <section className="fr-tile relative h-[62vh] min-h-[420px] overflow-hidden sm:h-[78vh]" data-testid="store-hero">
    <img src={HERO} alt="Model wearing a ranger cloak" className="fr-tile-img absolute inset-0 h-full w-full object-cover object-[center_20%]" />
    <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4 px-4">
      <Link to="/fitting-room" className="fr-label px-4 py-1 text-3xl sm:text-5xl" data-testid="hero-cta">Fitting room</Link>
      <span className="bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">Snap a selfie. Wear the armory.</span>
      <span className="mt-2 h-[3px] w-20 bg-white" />
    </div>
  </section>
);

const CategoryTiles = () => {
  const { byId } = useStore();
  return (
    <section className="grid grid-cols-2 md:grid-cols-5" data-testid="category-tiles">
      {CATEGORIES.map((c, i) => (
        <Link key={c.id} to={`/shop/${c.slug}`} className="fr-tile group" data-testid={`category-tile-${c.slug}`}>
          <div className={`aspect-[4/5] overflow-hidden ${i % 2 ? "bg-black" : "bg-[#f2f2f2]"}`}>
            {byId[c.cover] && <img src={byId[c.cover].image} alt={c.label} className="fr-tile-img h-full w-full object-cover" />}
          </div>
          <p className="px-2 py-2 text-sm font-extrabold uppercase sm:text-lg">{c.label}</p>
        </Link>
      ))}
    </section>
  );
};

const GetTheLook = () => (
  <section className="bg-black pb-10 text-white" data-testid="get-the-look">
    <h2 className="px-4 py-6 text-3xl font-extrabold uppercase sm:px-8 sm:text-4xl">Get the look</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {LOOKS.map((l) => (
        <Link key={l.id} to={`/fitting-room?look=${l.label}`} className="fr-tile relative aspect-[3/4] overflow-hidden" data-testid={`look-tile-${l.id}`}>
          <img src={l.image} alt={`${l.label} look`} className="fr-tile-img h-full w-full object-cover" />
          <span className="absolute bottom-3 left-3 text-lg font-extrabold uppercase drop-shadow sm:text-2xl">{l.label}</span>
        </Link>
      ))}
    </div>
    <div className="mt-8 flex justify-center">
      <Link to="/fitting-room" className="border border-white px-5 py-3 text-sm font-bold uppercase transition-colors hover:bg-white hover:text-black" data-testid="see-all-styles-button">
        Ask the stylist
      </Link>
    </div>
  </section>
);

const Picks = () => {
  const { products } = useStore();
  const picks = [...products].filter((p) => ["rare", "epic", "legendary"].includes(p.rarity)).slice(0, 8);
  return (
    <section className="px-4 py-10 sm:px-8" data-testid="home-picks">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-2xl font-extrabold uppercase sm:text-3xl">It may interest you</h2>
        <Link to="/shop/all" className="text-xs font-bold uppercase underline" data-testid="home-see-all">See all</Link>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {picks.map((p) => <div key={p.id} className="w-[46%] shrink-0 sm:w-[30%] lg:w-[19%]"><ProductCard product={p} /></div>)}
      </div>
    </section>
  );
};

const EventsTeaser = () => {
  const { api } = useStore();
  const [events, setEvents] = useState([]);
  useEffect(() => { api("get", "/events").then((e) => setEvents(e.slice(0, 3))).catch(() => {}); }, [api]);
  return (
    <section className="border-t border-black px-4 py-10 sm:px-8" data-testid="home-events">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-2xl font-extrabold uppercase sm:text-3xl">Next quests near Montreal</h2>
        <Link to="/events" className="text-xs font-bold uppercase underline" data-testid="home-all-events">All events</Link>
      </div>
      {events.length ? <div className="grid gap-px bg-black md:grid-cols-3">{events.map((e) => <EventCard key={e.id} event={e} />)}</div>
        : <p className="text-sm uppercase text-[#555555]">Upcoming LARP events will appear here. <Link to="/events" className="underline">Find events</Link></p>}
    </section>
  );
};

export default function HomePage() {
  return (
    <div data-testid="home-page">
      <Hero />
      <CategoryTiles />
      <GetTheLook />
      <Picks />
      <EventsTeaser />
    </div>
  );
}
