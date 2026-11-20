# LARP Outfitter (Quête & Équipement / Quest & Gear) - PRD

## Original problem
App where LARP players buy gear for events. Track LARP events within 3-4h of Montreal. Categories: camping, costumes, makeup, weapons. Selfie upload + AI preview of the player in gear. Two flows: (A) pick items → preview, (B) AI character interview → recommendations.

## Decisions (approved plan)
Bilingual FR (default)/EN; Google sign-in (Emergent Clerk); Quebec residents only (checkbox + QC postal code at checkout); events in Quebec only; in-app shop (CAD); Stripe test mode with GST+QST (Stripe Tax calc_only); Emergent universal key for AI.

## Architecture
- Backend FastAPI: server.py (routes), ai.py (Claude Sonnet 5.5 web-search events, interview stream, recommendations; Gemini 3.1 flash image preview), catalog.py (24 bilingual products), storage.py (Emergent object storage), clerk_auth.py, setup_stripe.py (creates Stripe products/prices + QC tax registration).
- Frontend React: lib/i18n.js, lib/appState.js, pages (Landing, Home, Profile, Events, Shop, BuildLook, Interview, LookDetail, Looks, Commerce).
- Shared AI key allows 1 concurrent LLM request → global lock + retry in ai.py.

## Implemented (2026-11-20)
- FR/EN toggle, Google sign-in, profile + Quebec gate + selfie upload
- AI event search (10 real Quebec events found), refresh, source/last-checked
- Shop, cart drawer, Flow A builder w/ budget meter, Flow B streaming interview + recommendations, look page (preview polling, swap/remove/add items, add all to cart), looks gallery
- Stripe checkout (QC address only, GST+QST verified 14.975%), payment success polling, order history
- Verified via curl + screenshots; full testing-agent run NOT yet done

## Rule changes (2026-11-20, for branch e.g. `guest-checkout-rules`)
- No login needed until checkout: anonymous guest id (localStorage → X-Guest-Id header) owns profile, selfie, looks, interview, cart
- Signing in (at checkout) merges guest data into the Google account (/api/guest/merge)
- Quebec residency checkbox and gate removed; Montreal is the default city/focus. Shipping still Quebec postal codes only
- Orders and payment status require sign-in

## Nav & profile edits (2026-11-20)
- Shop link removed from header nav (/shop route still exists); new "Choose your path" hover dropdown (desktop) / tap-to-expand (mobile) linking Path A (/build) and Path B (/interview)
- Profile: Units dropdown next to height/weight (Metric cm/kg or Standard ft+in/lb); values always stored in metric; `units` saved on profile

## Backlog
- P0: full end-to-end test run (testing agent); verify preview UI flow + Stripe redirect in browser
- P1: admin (products, approve events, orders); Flow A vs B usage analytics; hide past events
- P2: shipping/pickup, rentals, group sharing, expand beyond Quebec
