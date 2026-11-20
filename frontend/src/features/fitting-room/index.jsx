import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createApi, downscale } from "./api";
import { useCatalog } from "./hooks/useCatalog";
import { useOutfit } from "./hooks/useOutfit";
import { useTryOn } from "./hooks/useTryOn";
import { useStylist } from "./hooks/useStylist";
import { OutfitList } from "./OutfitList";
import { SelfieMirror } from "./SelfieMirror";
import { WardrobeTray } from "./WardrobeTray";
import { CatalogFilters } from "./CatalogFilters";
import { CatalogGrid } from "./CatalogGrid";
import { ItemDrawer } from "./ItemDrawer";
import { StylistChat } from "./StylistChat";
import { ProfileDialog } from "./ProfileDialog";
import "./fitting-room.css";

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function VirtualFittingRoom({ apiBase = process.env.REACT_APP_BACKEND_URL, onCheckout, initialItemId, initialLook }) {
  const api = useMemo(() => createApi(apiBase), [apiBase]);
  const [profile, setProfile] = useState(null);
  const [styleNote, setStyleNote] = useState("");
  const [highlight, setHighlight] = useState([]);
  const [drawerItem, setDrawerItem] = useState(null);
  const [pendingSelfie, setPendingSelfie] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const catalog = useCatalog(api, profile);
  const ctxRef = useRef({});
  ctxRef.current = { filters: catalog.filters, style_note: styleNote, profile };
  const outfit = useOutfit();
  const tryOn = useTryOn(api, outfit.equipped, styleNote);
  const { equipped, bench } = outfit;

  const applyAssistant = (res) => {
    outfit.apply({ equip: res.equip, unequip: res.unequip, remove: res.remove, clear: res.clear_all }, catalog.byId);
    if (res.filters) {
      ctxRef.current.filters = { ...ctxRef.current.filters, ...res.filters };
      catalog.setFilters(ctxRef.current.filters);
    }
    setHighlight(res.highlight);
    if (typeof res.style_note === "string") {
      ctxRef.current.style_note = res.style_note;
      setStyleNote(res.style_note);
    }
    if (!tryOn.selfieRef.current && res.equip.length) toast("Add a selfie to see these on you");
  };

  const stylist = useStylist(api, () => ({
    ...ctxRef.current,
    equipped_ids: Object.values(outfit.ref.current.equipped).map((i) => i.id), benched_ids: Object.keys(outfit.ref.current.bench),
  }), applyAssistant);

  const handleSelfie = async (dataUrl) => {
    try {
      setPendingSelfie(await downscale(dataUrl));
      setProfileOpen(true);
    } catch {
      toast.error("That file isn't a readable image. Try a JPG or PNG.");
    }
  };

  const saveProfile = (p) => {
    setProfile(p);
    tryOn.setProfile(p);
    setProfileOpen(false);
    catalog.setFilters((f) => ({ ...f, gender: p.gender === "other" ? null : p.gender }));
    if (!pendingSelfie) return toast.success("Measurements updated");
    tryOn.setSelfie(pendingSelfie);
    setPendingSelfie(null);
    toast.success("Your model is ready.");
  };

  const pickLook = (look) => {
    outfit.wearOnly(look.items, catalog.byId);
    setStyleNote(look.note);
    tryOn.showLook(look);
  };

  const checkout = (items) => (onCheckout ? onCheckout(items) : toast.success(`${items.length} items ready for checkout (marketplace cart not connected yet)`));
  const selfie = tryOn.selfie;
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !Object.keys(catalog.byId).length) return;
    started.current = true;
    const item = initialItemId && catalog.byId[initialItemId];
    if (item) { outfit.toggle(item); setDrawerItem(item); }
    if (initialLook) { stylist.send(`Build me a full ${initialLook.toLowerCase()} look`); scrollToId("stylist"); }
  }, [catalog.byId, initialItemId, initialLook, outfit, stylist]);

  return (
    <div className="fr-root min-h-screen" data-testid="virtual-fitting-room">
      <div id="fitting-room" className="scroll-mt-28 border-b border-black px-4 py-6 sm:px-8">
        <h2 className="text-3xl font-extrabold uppercase sm:text-4xl">Fitting room</h2>
        <p className="mt-1 text-xs font-semibold uppercase text-[#555555]" data-testid="header-selfie-status">{selfie ? "Model ready · every piece shown is a real listing" : "Add a selfie to try gear on yourself"}</p>
      </div>
      <main className="mx-auto grid max-w-[1600px] grid-cols-12 gap-6 px-4 py-6 sm:px-8">
        <div className="col-span-12 flex flex-col gap-5 md:col-span-6 lg:col-span-4 xl:col-span-3">
          <SelfieMirror profile={profile} onEditProfile={() => setProfileOpen(true)} selfie={selfie} onSelfie={handleSelfie} preview={tryOn.preview} generating={tryOn.generating} dirty={tryOn.dirty}
            onGenerate={tryOn.regenerate} looks={tryOn.looks} itemCount={Object.keys(equipped).length} onPickLook={pickLook} />
          <WardrobeTray equipped={equipped} onRemove={outfit.remove} onClear={outfit.clear} onOpen={setDrawerItem}
            onCheckout={checkout} styleNote={styleNote} onClearNote={() => setStyleNote("")} />
        </div>
        <section id="catalog" className="scroll-mt-28 col-span-12 md:col-span-6 lg:col-span-8 xl:col-span-6" data-testid="catalog-section">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold uppercase sm:text-3xl">It may interest you</h2>
            <span className="text-xs text-[#666666]" data-testid="catalog-count">{catalog.products.length} items</span>
          </div>
          <CatalogFilters profile={profile} fitOnly={catalog.fitOnly} setFitOnly={catalog.setFitOnly} filters={catalog.filters} setFilters={catalog.setFilters} facets={catalog.facets}>
            <OutfitList equipped={equipped} bench={bench} profile={profile} onOpen={setDrawerItem} onToggle={outfit.toggle} onRemove={outfit.remove} />
          </CatalogFilters>
          <div className="mt-5">
            <CatalogGrid profile={profile} products={catalog.products} equipped={equipped} highlight={highlight} onOpen={setDrawerItem} onToggle={outfit.toggle} loading={catalog.loading} />
          </div>
        </section>
        <aside id="stylist" className="scroll-mt-28 col-span-12 lg:col-span-12 xl:sticky xl:top-[5.5rem] xl:col-span-3 xl:self-start">
          <StylistChat messages={stylist.messages} onSend={stylist.send} thinking={stylist.thinking} byId={catalog.byId} onOpen={setDrawerItem} />
        </aside>
      </main>
      <ProfileDialog open={profileOpen} initial={profile} onSave={saveProfile} onCancel={() => { setProfileOpen(false); setPendingSelfie(null); }} />
      <ItemDrawer profile={profile} item={drawerItem} onClose={() => setDrawerItem(null)} isEquipped={drawerItem && equipped[drawerItem.category]?.id === drawerItem.id}
        replacing={drawerItem && equipped[drawerItem.category]} onToggle={outfit.toggle} />
    </div>
  );
}
