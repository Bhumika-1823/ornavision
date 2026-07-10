# Ornavision — Fixed & Verified Standalone Build

## What was actually broken

This project was exported from a Replit **monorepo/workspace**, and only the
`artifacts/ornavision` sub-package was included in the zip. On its own it could
not `npm install`, let alone build or run, because:

1. **`package.json`** used pnpm-workspace `"catalog:"` version placeholders for ~15
   packages. Those only resolve inside the original monorepo's
   `pnpm-workspace.yaml`, which wasn't in the zip — so `npm install` had no
   real version to install.
2. **`@workspace/api-client-react": "workspace:*"`** pointed at a private,
   never-published internal package (confirmed 404 on the npm registry). It
   also turned out to be unused anywhere in the code, so it's been removed.
3. **`tsconfig.json`** extended `"../../tsconfig.base.json"` and referenced
   `"../../lib/api-client-react"` — both two directories above the folder
   that was actually exported, so they didn't exist.
4. **`vite.config.ts`** threw an error and refused to even start unless `PORT`
   and `BASE_PATH` environment variables were manually set (defaults that
   only existed on Replit's infra), and it aliased `@assets` to a directory
   outside the exported folder.

None of this was a bug in the actual React/TypeScript code — it was all
packaging/config fallout from exporting one package out of a larger workspace.

## What I fixed
- Rewrote `package.json` with real, pinned, compatible versions and removed
  the dead `@workspace/api-client-react` dependency.
- Rewrote `vite.config.ts` as a standalone config with sane local defaults
  (no required env vars), dropped the Replit-only dev plugins (cartographer/
  dev-banner/runtime-error-modal) since they only activate inside Replit's
  own iframe preview and add nothing standalone.
- Rewrote `tsconfig.json` as a self-contained config (no missing base file).
- Added missing `aria-label`s to the icon-only wishlist buttons (home, shop,
  product page) for accessibility/screen readers.
- Removed a stray, unused Google Fonts `<link>` for "Inter" in `index.html`
  that was dead weight — the real brand fonts (Cinzel + Outfit) are loaded
  correctly via `src/index.css` and were unaffected.
- Wrote a real meta description (the old one was Replit's placeholder text).

## What I verified (not just assumed)
I actually ran this, in a real headless browser, end to end:
- ✅ `npm install` — clean, no errors
- ✅ `npm run typecheck` — clean
- ✅ `npm run build` — clean production build
- ✅ All 9 routes load with zero console/React errors: `/`, `/shop`,
  `/shop/:slug`, `/tryon`, `/cart`, `/checkout`, `/designer`, `/wishlist`,
  and an unmatched route (404 page)
- ✅ Full purchase flow: add 2 different products to cart from the product
  page → cart shows both correctly → apply coupon `ORNA10` → discount
  applies → go to checkout → fill the form → submit → order-confirmed
  screen renders with a generated order number
- ✅ Wishlist toggle: add a product to wishlist from the product page → item
  appears on `/wishlist`
- ✅ The try-on page degrades gracefully with a clear on-screen error message
  if the MediaPipe scripts can't load (rather than a blank screen/crash)

## What I could **not** verify from this sandbox
- The live camera / face & hand tracking overlay itself — that needs a real
  browser with camera access and a face in frame, which a headless container
  can't provide. The landmark math was reviewed by hand in the code and looks
  correct, but please test it yourself in a real browser as the final check.
- Google Fonts / MediaPipe CDN loads were blocked by *this sandbox's own*
  network firewall during testing (403/CORS errors you may notice in my test
  logs) — that's specific to this analysis environment, not your app. On any
  normal internet connection these will load fine.

## How to run it
```bash
npm install
npm run dev       # http://localhost:5173
# or
npm run build && npm run preview
```
