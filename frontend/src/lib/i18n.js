import { createContext, useContext, useEffect, useState } from "react";

const D = {
  fr: {
    brand: "Quête & Équipement", tagline: "L'armurerie des GN du Québec",
    nav_events: "Événements", nav_shop: "Boutique", nav_looks: "Mes looks", nav_orders: "Commandes", nav_profile: "Profil",
    signin: "Se connecter", co_signin: "Connectez-vous avec Google pour payer. Votre panier, vos looks et votre égoportrait seront conservés.", hero_eyebrow: "GN autour de Montréal · jusqu'à 4 h de route",
    hero_title: "Équipez-vous pour votre prochaine quête.",
    hero_sub: "Costumes, maquillage, armes sécuritaires et matériel de camp. Téléversez un égoportrait et voyez-vous en personnage avant d'acheter.",
    hero_cta: "Commencer l'aventure", quebec_only_note: "Livraison au Québec seulement, pour l'instant.",
    flow_a_badge: "Atelier interactif", flow_a_title: "Voie A : Composez votre attirail",
    flow_a_desc: "Choisissez vous-même chaque pièce, suivez votre budget et générez votre aperçu.",
    flow_b_badge: "Entretien IA", flow_b_title: "Voie B : L'Oracle de personnage",
    flow_b_desc: "Répondez à quelques questions sur votre personnage et recevez un ensemble complet recommandé.",
    start: "Commencer", welcome: "Bienvenue, aventurier·ère", choose_path: "Choisissez votre voie",
    upcoming_events: "Événements à venir",
    cat_costumes: "Costumes", cat_makeup: "Maquillage", cat_weapons: "Armes", cat_camping: "Camping",
    add: "Ajouter", added: "Ajouté", remove: "Retirer", add_to_cart: "Ajouter au panier", add_all: "Tout ajouter au panier",
    cart: "Panier", cart_empty: "Votre panier est vide.", subtotal: "Sous-total", taxes_note: "TPS + TVQ calculées au paiement.",
    checkout: "Passer à la caisse", budget: "Budget", over_budget: "Au-dessus du budget", within_budget: "Dans le budget",
    ob_title: "Votre profil d'aventurier", ob_sub: "Ces détails guident les recommandations et l'aperçu IA. Ils restent privés.",
    ob_city: "Ville ou région", ob_gender: "Genre", ob_height: "Taille (cm)",
    ob_weight: "Poids (kg)", ob_budget: "Budget par événement (CAD)", ob_selfie: "Votre égoportrait",
    ob_selfie_hint: "Visage bien éclairé, de face. JPG ou PNG, 10 Mo max.", ob_upload: "Téléverser un égoportrait",
    ob_replace: "Remplacer", save: "Enregistrer", saved: "Profil enregistré", optional: "facultatif",
    g_woman: "Femme", g_man: "Homme", g_nb: "Non binaire", g_none: "Préfère ne pas dire",
        ev_title: "GN au Québec", ev_sub: "Événements de grandeur nature à environ 3 à 4 h de route de Montréal, trouvés par l'IA sur le web.",
    ev_refresh: "Actualiser les événements", ev_refreshing: "Recherche en cours…", ev_checked: "Vérifié le",
    ev_from_mtl: "de Montréal", ev_empty: "Aucun événement pour l'instant. Lancez une recherche.",
    ev_disclaimer: "Les infos trouvées par l'IA peuvent être incomplètes : vérifiez toujours auprès de l'organisateur.",
    ev_attach: "Préparer un look", ev_none: "Aucun événement", event: "Événement",
    shop_title: "La boutique", shop_sub: "Tout est vendu ici, aux prix habituels du marché.", all: "Tout",
    build_title: "Composez votre attirail", build_cats: "Catégories souhaitées",
    build_selected: "Votre sélection", build_none: "Ajoutez des pièces pour commencer.",
    create_look: "Créer l'aperçu", creating: "Création…",
    selfie_needed: "Ajoutez un égoportrait dans votre profil pour générer un aperçu.",
    iv_title: "L'Oracle de personnage", iv_sub: "Racontez-moi qui vous voulez incarner.",
    iv_placeholder: "Votre réponse…", iv_send: "Envoyer", iv_recommend: "Voir mes recommandations",
    iv_recommending: "L'Oracle forge votre ensemble…", iv_cats: "Catégories à inclure",
    look_title: "Votre look", preview: "Aperçu IA", gen_preview: "Générer l'aperçu", regen: "Régénérer",
    generating: "L'IA vous habille… (environ 30 s)", preview_failed: "L'aperçu a échoué. Réessayez.",
    preview_hint: "Le matériel de camping est listé mais non dessiné sur vous.",
    gear_list: "Liste d'équipement", swap: "Échanger", swap_title: "Échanger la pièce", total: "Total",
    camping_add: "Ajouter du camping", why: "Pourquoi",
    looks_title: "Mes looks", looks_empty: "Aucun look encore. Choisissez une voie pour commencer.",
    flow_build: "Voie A", flow_interview: "Voie B", open: "Ouvrir",
    co_title: "Paiement", co_ship: "Adresse de livraison (Québec)", co_name: "Nom complet", co_line1: "Adresse",
    co_city: "Ville", co_province: "Province", co_postal: "Code postal", co_pay: "Payer avec Stripe",
    co_test: "Mode test : utilisez la carte 4242 4242 4242 4242, toute date future, tout CVC. Aucun argent réel.",
    co_quebec_only: "Livraison au Québec seulement : le code postal doit commencer par G, H ou J.",
    pay_checking: "Confirmation du paiement…", pay_success: "Commande confirmée!", pay_success_sub: "Merci! Votre équipement est en route.",
    pay_failed: "Paiement non confirmé.", pay_cancel: "Paiement annulé", pay_cancel_sub: "Votre panier est toujours là.",
    back_cart: "Retour au panier", orders_title: "Historique des commandes", orders_empty: "Aucune commande encore.",
    order_no: "Commande", tax: "Taxes", view_orders: "Voir mes commandes", continue: "Continuer",
    error: "Une erreur est survenue", demo_note: "Démo : paiements en mode test.",
  },
  en: {
    brand: "Quest & Gear", tagline: "Quebec's LARP outfitter",
    nav_events: "Events", nav_shop: "Shop", nav_looks: "My looks", nav_orders: "Orders", nav_profile: "Profile",
    signin: "Sign in", co_signin: "Sign in with Google to pay. Your cart, looks and selfie will be kept.", hero_eyebrow: "LARP around Montreal · up to 4h away",
    hero_title: "Gear up for your next quest.",
    hero_sub: "Costumes, makeup, LARP-safe weapons and camp gear. Upload a selfie and see yourself in character before you buy.",
    hero_cta: "Begin the adventure", quebec_only_note: "Shipping within Quebec only, for now.",
    flow_a_badge: "Interactive studio", flow_a_title: "Path A: Build your look",
    flow_a_desc: "Hand-pick every piece, track your budget and generate your preview.",
    flow_b_badge: "AI interview", flow_b_title: "Path B: The Character Oracle",
    flow_b_desc: "Answer a few questions about your character and get a full recommended kit.",
    start: "Start", welcome: "Welcome, adventurer", choose_path: "Choose your path",
    upcoming_events: "Upcoming events",
    cat_costumes: "Costumes", cat_makeup: "Makeup", cat_weapons: "Weapons", cat_camping: "Camping",
    add: "Add", added: "Added", remove: "Remove", add_to_cart: "Add to cart", add_all: "Add all to cart",
    cart: "Cart", cart_empty: "Your cart is empty.", subtotal: "Subtotal", taxes_note: "GST + QST calculated at checkout.",
    checkout: "Checkout", budget: "Budget", over_budget: "Over budget", within_budget: "Within budget",
    ob_title: "Your adventurer profile", ob_sub: "These details shape recommendations and the AI preview. They stay private.",
    ob_city: "City or region", ob_gender: "Gender", ob_height: "Height (cm)",
    ob_weight: "Weight (kg)", ob_budget: "Budget per event (CAD)", ob_selfie: "Your selfie",
    ob_selfie_hint: "Well-lit, front-facing. JPG or PNG, 10 MB max.", ob_upload: "Upload a selfie",
    ob_replace: "Replace", save: "Save", saved: "Profile saved", optional: "optional",
    g_woman: "Female", g_man: "Male", g_nb: "Non-binary", g_none: "Prefer not to say",
        ev_title: "LARP in Quebec", ev_sub: "LARP events roughly 3 to 4 hours' drive from Montreal, found by AI on the web.",
    ev_refresh: "Refresh events", ev_refreshing: "Searching…", ev_checked: "Checked",
    ev_from_mtl: "from Montreal", ev_empty: "No events yet. Run a search.",
    ev_disclaimer: "AI-found info may be incomplete: always confirm with the organizer.",
    ev_attach: "Prepare a look", ev_none: "No event", event: "Event",
    shop_title: "The shop", shop_sub: "Everything sold here, at typical market prices.", all: "All",
    build_title: "Build your look", build_cats: "Categories you want",
    build_selected: "Your selection", build_none: "Add pieces to get started.",
    create_look: "Create preview", creating: "Creating…",
    selfie_needed: "Add a selfie in your profile to generate a preview.",
    iv_title: "The Character Oracle", iv_sub: "Tell me who you want to become.",
    iv_placeholder: "Your answer…", iv_send: "Send", iv_recommend: "See my recommendations",
    iv_recommending: "The Oracle is forging your kit…", iv_cats: "Categories to include",
    look_title: "Your look", preview: "AI preview", gen_preview: "Generate preview", regen: "Regenerate",
    generating: "AI is dressing you… (about 30s)", preview_failed: "Preview failed. Please retry.",
    preview_hint: "Camping gear is listed but not drawn on you.",
    gear_list: "Gear list", swap: "Swap", swap_title: "Swap item", total: "Total",
    camping_add: "Add camping", why: "Why",
    looks_title: "My looks", looks_empty: "No looks yet. Pick a path to begin.",
    flow_build: "Path A", flow_interview: "Path B", open: "Open",
    co_title: "Checkout", co_ship: "Shipping address (Quebec)", co_name: "Full name", co_line1: "Address",
    co_city: "City", co_province: "Province", co_postal: "Postal code", co_pay: "Pay with Stripe",
    co_test: "Test mode: use card 4242 4242 4242 4242, any future date, any CVC. No real money.",
    co_quebec_only: "Quebec shipping only: postal code must start with G, H or J.",
    pay_checking: "Confirming payment…", pay_success: "Order confirmed!", pay_success_sub: "Thank you! Your gear is on its way.",
    pay_failed: "Payment not confirmed.", pay_cancel: "Payment cancelled", pay_cancel_sub: "Your cart is still here.",
    back_cart: "Back to cart", orders_title: "Order history", orders_empty: "No orders yet.",
    order_no: "Order", tax: "Taxes", view_orders: "View my orders", continue: "Continue",
    error: "Something went wrong", demo_note: "Demo: payments in test mode.",
  },
};

const LangCtx = createContext(null);

const initialLang = () => {
  const saved = localStorage.getItem("lang");
  if (saved === "fr" || saved === "en") return saved;
  return (navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
};

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(initialLang);
  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const t = (k) => D[lang][k] ?? k;
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
};

export const useLang = () => useContext(LangCtx);
export const money = (n, lang) =>
  new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
