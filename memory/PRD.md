# PRD: LARP Virtual Fitting Room

## Problem statement
A standalone feature for a LARP gear marketplace (main site not built yet). Users take a selfie, then see an AI-made preview of themselves wearing chosen gear. They can chat (or speak) with an AI assistant to change the look. The preview updates live. Users can click an item to see info and price, and filter by price, gender, type and more. It must be easy to plug into the main site later.
Added on 2026-11-20: when a selfie is added, the user must enter height, weight and gender so gear can be filtered. Every item has sizing info (sizes, length, measurements, fit range, one-of-a-kind).

## Architecture
- Backend: `/app/backend/fitting_room.py` (APIRouter `/api/fitting-room`), seed data in `fitting_room_catalog.py`, stored in the shared Mongo `products` collection. `init(db)` adds any missing items on startup.
- Endpoints: GET /products (filters: category, gender, color, aesthetic, min/max_price, q, height_cm, weight_kg), GET /products/{id}, GET /facets, POST /tryon (Gemini Nano Banana `gemini-3.1-flash-image-preview`), POST /assistant (OpenAI `gpt-5.4`, returns a JSON reply with the actions to take).
- Frontend: a self-contained module `/app/frontend/src/features/fitting-room/` with a default export `VirtualFittingRoom({ apiBase, onCheckout })`.
- Session only: selfies, previews, profile and chat are never saved on the server.

## Implemented (2026-11-20)
- Take a selfie with the webcam or upload a photo, then fill in the required measurements (fit, height in cm or ft/in, weight in kg or lb)
- AI try-on preview (full body) with staged loading, a "hold to see the original" button and a strip of past looks
- Catalog of 32 items with AI-made product photos. Filters: category, fit, color, aesthetic, max price, search, and "only gear that fits me"
- Item drawer showing price, seller, materials and a sizing block (sizes, length, measurements, fit ranges, adjustable, one-of-a-kind, fit status)
- AI stylist chat with quick prompts and a browser mic button. It equips and removes items, sets filters and the mood, then regenerates the preview automatically. Sizing is enforced on the server.
- Wardrobe tray with a running total and a Buy outfit button (a placeholder until the marketplace cart exists)
- Embed helper dialog

## Implemented (2026-11-20, iteration 3)
- The Quartermaster only sees and suggests listings that are in stock. Server-side checks drop any item it makes up, and also drop suggestions that don't fit the user. Try-on rejects unknown or unavailable items (409). The image prompt tells the model to show only the listed pieces.
- A "Your selection" strip under the search lists each selected item with price, size, seller and fit. Users can open it, remove it, take it off or swap it in. Items that are taken off are set aside and kept.
- The stylist understands commands to take off, put back, remove or swap items, using the worn and set-aside item lists. Voice is a continuous hands-free mic mode. Messages sent while the stylist is still answering wait in a queue.
- The preview regenerates on its own about 1.2s after any outfit change. Emptying the outfit shows the plain selfie again. Filters returned by the stylist are merged with the current ones instead of replacing them.

## Implemented (2026-11-20, iteration 4: code-quality refactor)
- Backend: `list_products` now takes a `ProductQuery` dataclass and builds its query in `_build_query`. Try-on and the assistant were split into small helpers. LLM ids are type-checked. Catalog `_p`/`_s` take fewer arguments.
- Frontend: `VirtualFittingRoom` was split into the hooks `useCatalog`, `useOutfit`, `useTryOn` and `useStylist`, plus a `FittingHeader`. SelfieMirror, ProfileDialog and CatalogFilters were broken into sub-components. Lists use stable keys. The eslint-disable comments are gone.
- Fixes: unit toggles now convert the entered value; "Show all fits" clears the gender filter; stale catalog responses are ignored; one preview per click; a no-op stylist reply no longer restarts the preview; queued stylist turns see the latest filters and mood.

## Implemented (2026-11-20, iteration 5: Bershka-style restyle)
- A white, monochrome storefront using the Archivo uppercase typeface, with sharp corners and thin black lines.
- Sections: a sticky nav (HALBERD placeholder logo, category links, bordered search, Embed, Outfit count, and a second scrollable row on mobile); a full-width hero with a boxed "FITTING ROOM" label; 4 edge-to-edge category tiles (Helmets, Armor, Robes & Tunics, Weapons); a black GET THE LOOK section (Rogue, Paladin, Witch, Viking tiles that send the request to the stylist); then the fitting room with an "IT MAY INTEREST YOU" product grid.
- Category links and tiles scroll to the filtered catalog. Look tiles scroll to the stylist. Grey text and borders were darkened for readable contrast.

## Implemented (2026-11-20, iteration 6: merged Quest Closet into one site)
- Brand is QUEST CLOSET. React Router pages: home, /shop/:slug (11 tabs, including shoes, makeup-fx and camping), /product/:id, /fitting-room, /events, /orders, /payment/success, /payment/cancel and the Clerk sign-in/sign-up pages.
- New backend store.py: guest or signed-in cart (sent as X-Guest-Id), guest-to-account merge, Stripe checkout (claimable sandbox, prices from the DB, US/CA shipping, automatic tax falling back to no tax until a head office is set), status polling, webhook, orders, and events near Montreal found by Claude web search.
- Added 10 seed items (2 shoes, 5 makeup, 3 camping). Camping is wearable:false and kept out of the fitting room. The fitting room's "Add outfit to bag" adds to the shared bag; ?item= and ?look= deep links work.
- Emergent-managed Clerk Google sign-in.

## Backlog
- Seller listing form, inventory and one-of-a-kind reservation, resuming checkout after sign-in, FR/EN language toggle, rate limits on the AI features

- P1: rate limits or quotas on the paid AI endpoints; masking selfies and chat from session replay; a minimum-price filter; server-side checks on selfie size
- P1: connect to the real marketplace cart and listings, and let sellers enter sizing
- P2: Whisper voice input for browsers without speech recognition; shareable look cards
