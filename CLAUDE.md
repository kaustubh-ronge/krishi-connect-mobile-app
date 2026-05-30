@AGENTS.md

# KrishiConnect Mobile App — CLAUDE.md

> Onboarding guide for AI agents. Start here before making any changes.

---

## Project Overview

KrishiConnect Mobile is the **React Native companion app** to the KrishiConnect B2B agricultural marketplace. Built with **Expo SDK v54**, **Expo Router**, and **NativeWind v4**.

The mobile app has **no database access** — all data operations go through the Next.js web server's REST API at `NEXT_PUBLIC_API_URL/api/mobile/v1/*`.

---

## Architecture Overview

```
React Native App (Expo)
       │
  services/api.ts (useApiClient) ── injects Clerk JWT token
       │
  KrishiConnect Web Server (Next.js)
  └── /api/mobile/v1/* ── REST API endpoints
       └── actions/*.js ── Server Actions (shared with web)
           └── Neon PostgreSQL
```

---

## ⚠️ Most Important Rules (Read First)

1. **No database access** — mobile is a pure API consumer. See [AGENTS.md](AGENTS.md).

2. **No Razorpay Native SDK** — use WebView bridge via `expo-web-browser`. See [AGENTS.md](AGENTS.md).

3. **Always sync cart on screen focus** — call `fetchCart(api)` in `useFocusEffect`.

4. **TypeScript required** — unlike the web app, all source files must be `.ts`/`.tsx`.

5. **Expo SDK v54** — read versioned docs at https://docs.expo.dev/versions/v54.0.0/

6. **Read full [context-mobile.md](context-mobile.md)** before modifying checkout or special delivery.

---

## Documentation Entry Points

| What you want to know | Where to look |
|---|---|
| Full architecture + workflows | [context-mobile.md](context-mobile.md) |
| Agent rules + constraints | [AGENTS.md](AGENTS.md) |
| Reusable patterns + debugging | [SKILLS.md](SKILLS.md) |
| Web app context (backend) | `../krishi-web-app/context-web.md` |
| Web AGENTS.md (backend rules) | `../krishi-web-app/AGENTS.md` |

---

## Important Workflows

| Workflow | Primary File(s) |
|---|---|
| Auth + onboarding | `app/_layout.tsx`, `app/onboarding.tsx`, `store/userStore.ts` |
| Cart display + sync | `app/(tabs)/cart.tsx`, `store/cartStore.ts` |
| Special delivery states | `app/(tabs)/cart.tsx`, `components/SpecialDeliveryModal.tsx` |
| Product page qty restriction | `app/product/[id].tsx` |
| Checkout (COD + Online) | `app/checkout.tsx` |
| Payment WebView bridge | `app/checkout.tsx` → `expo-web-browser` |
| Seller: listings | `app/my-listings.tsx`, `app/create-listing.tsx` |
| Seller: orders | `app/manage-orders.tsx` |
| Delivery jobs | `app/deliveries.tsx` |

---

## Implementation Hotspots

- **`app/checkout.tsx`** — COD/Online branching, collision dialog, WebView bridge
- **`store/cartStore.ts`** — Optimistic updates, `fetchCart()` sync
- **`services/api.ts`** — Auth token injection (every API call depends on this)
- **`app/product/[id].tsx`** — `remainingAllowedQty` calculation

---

## Risky Systems

### Checkout Bridge
- `WEB_APP_URL` must point to the correct web server
- The mobile app opens `/mobile-checkout` in `expo-web-browser` — this page MUST be publicly accessible on the web server
- Deep link URL must be registered in `app.json` scheme

### Cart Synchronization
- `fetchCart(api)` must run on cart screen AND product page focus
- Failure causes stale `currentCartQuantity` → wrong `remainingAllowedQty` → allows over-ordering

### Special Delivery Lifecycle
- The four states (unserviceable/pending/rejected/approved) must all be rendered correctly
- "Cancel Request" and "Clear & Retry" must DELETE the request via API, not just update local state

---

## Quick Reference

```bash
# Development
npx expo start

# Build
eas build --platform android
eas build --platform ios

# Clear cache
npx expo start --clear
```

**Key env vars:** `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
