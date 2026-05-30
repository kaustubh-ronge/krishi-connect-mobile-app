# KrishiConnect Mobile App — AGENTS.md

> Rules, constraints, and navigation guidance for AI agents working on this React Native codebase.

---

## ⚠️ EXPO VERSION: Read Versioned Docs First

This project uses **Expo SDK v54**. Before writing any Expo or React Native code:
- Read exact versioned docs: https://docs.expo.dev/versions/v54.0.0/
- APIs change between SDK versions — do NOT use generic Expo docs without confirming the version
- NativeWind v4 has different APIs from v2/v3 — use v4-specific documentation

---

## ⚠️ CRITICAL RULE: This App Has No Direct Database Access

```
DO NOT add:
- Prisma client
- Direct PostgreSQL connection
- Any database ORM
- Any server-side logic

The mobile app is a pure API consumer.
All data comes from: NEXT_PUBLIC_API_URL/api/mobile/v1/*
```

---

## ⚠️ CRITICAL RULE: No Razorpay Native SDK

```
DO NOT add Razorpay React Native SDK.
Payment is handled via WebView bridge:
  1. Mobile opens WEB_APP_URL/mobile-checkout in expo-web-browser
  2. Web app handles Razorpay JS SDK
  3. Result communicated back via deep link
```

---

## Architecture Rules

### 1. All API Calls via `useApiClient()`
Never make raw fetch/axios calls in screens. Always:
```ts
const api = useApiClient();
const result = await api.get('mobile/v1/...');
const result = await api.post('mobile/v1/...', body);
```
This ensures Clerk auth tokens are always injected.

### 2. Cart Synchronization is Mandatory
On ANY screen that displays cart count or cart-dependent UI:
```ts
useFocusEffect(() => { fetchCart(api); });
```
Failure to sync causes stale `remainingAllowedQty` and incorrect UI states on the product page.

### 3. Profile Synchronization
On screens that need user data:
```ts
const { profile, fetchProfile } = useUserStore();
useEffect(() => { if (!profile) fetchProfile(api); }, []);
```

### 4. TypeScript Required
Unlike the web app (which uses JavaScript), the mobile app uses **TypeScript** (`.ts`/`.tsx`).
All new files must be TypeScript. Type safety is enforced.

### 5. NativeWind for Styling
Use `className` props with NativeWind (Tailwind) syntax.
Do NOT use `StyleSheet.create()` unless absolutely required for native-specific styles.
Both NativeWind `className` AND `StyleSheet` styles can coexist on a component if needed.

### 6. Animations via Moti
Use `MotiView`, `MotiText`, `MotiPressable` from `moti` for animations.
This is the React Native equivalent of Framer Motion.
Use `MotiPressable` instead of `TouchableOpacity` when press animations are needed.

---

## Workflow Rules

### Special Delivery (Mobile Must Match Web)
The mobile app must implement all four special delivery states on the cart screen:
- Unserviceable: grayscale + "Request Mediation" button → opens `SpecialDeliveryModal`
- Pending: yellow warning + "Cancel Request" → DELETE to API
- Rejected: red warning + "Clear & Retry" → DELETE to API
- Approved: green banner + quantity limit + countdown timer + "Cancel & Re-request"

**Quantity limit enforcement on product page:**
```
remainingAllowedQty = approvedQuantity - currentCartQuantity
```
The `isOutOfRange` flag is IGNORED when an approval exists.

### Checkout Collision Handling
When `response.data.isCollision === true`:
- Show Alert with three options: Cancel, Start Fresh, Resume
- "Start Fresh" re-POSTs with `forceFresh: true`
- "Resume Order" navigates to cart (`/(tabs)/cart`)

### COD vs Online Payment
- COD: `response.data.isCod === true` → show success alert, navigate to orders
- Online: Use `expo-web-browser` `openAuthSessionAsync()` with mobile-checkout URL
- NEVER implement Razorpay natively in React Native

### Dashboard Rendering Logic
`(tabs)/dashboard.tsx` must render based on `userStore.role`:
```
role === 'farmer' || role === 'agent' → seller dashboard
  sellingStatus !== 'APPROVED' → show "Pending Approval" state
role === 'delivery' → delivery jobs dashboard
role === 'none' → redirect to /onboarding
```

---

## Implementation Rules

### Adding a New Screen
1. Create in `app/` directory (Expo Router auto-registers)
2. For modal screens: add to `app/modal.tsx` or create a new `(modal)` group
3. Use `SafeAreaView` from `react-native-safe-area-context` as outer wrapper
4. Use `LinearGradient` from `expo-linear-gradient` for headers (matches existing style)
5. Add back button using `ArrowLeft` from `lucide-react-native`

### Adding a New API Call
1. Use `useApiClient()` hook for the API instance
2. Call the corresponding `/api/mobile/v1/<resource>` endpoint
3. Handle `response.success === false` → show `Alert.alert('Error', response.error)`
4. For mutations: call `fetchCart(api)` or `fetchProfile(api)` after success to sync state

### Adding Seller Features
1. Check `userStore.profile.sellingStatus === 'APPROVED'` before showing seller UI
2. Unapproved sellers see a "Pending Admin Approval" message
3. Location (`lat`/`lng`) must be set before creating/editing listings

---

## Business-Critical Constraints

| Constraint | Screen | Consequence if Broken |
|---|---|---|
| `fetchCart` on cart + product page focus | `cart.tsx`, `product/[id].tsx` | Stale qty counts, wrong remainingAllowedQty |
| Location required before checkout | `checkout.tsx` | Server rejects checkout with hard error |
| isCollision dialog shown | `checkout.tsx` | Duplicate orders created silently |
| `SpecialDeliveryModal` creates + sends support msg | `SpecialDeliveryModal.tsx` | Admin doesn't see the request |
| Deep link URL must match web redirect | `checkout.tsx` | Payment result not captured |
| `WEB_APP_URL` derived correctly from env | `checkout.tsx` | Wrong server for checkout |

---

## High-Risk Modification Areas

| Area | Risk | Reason |
|---|---|---|
| `checkout.tsx` | 🔴 Critical | Payment flow + collision handling + COD/Online branching |
| `cartStore.ts` | 🔴 Critical | Optimistic updates + sync — wrong state breaks entire cart |
| `services/api.ts` | 🔴 Critical | Auth token injection — wrong implementation = all API calls unauthorized |
| `store/userStore.ts` | 🟠 High | Role-based dashboard rendering depends on this |
| `SpecialDeliveryModal.tsx` | 🟠 High | Must send support message + create request atomically (via API) |
| `app/_layout.tsx` | 🟠 High | Auth state, font loading, initial routing |

---

## Repository Navigation

### Finding the payment flow
`app/checkout.tsx` → `handleCheckoutSuccess()` → `WebBrowser.openAuthSessionAsync()`

### Finding the special delivery flow
`app/(tabs)/cart.tsx` → special delivery state rendering
`components/SpecialDeliveryModal.tsx` → mediation request submission
`app/product/[id].tsx` → `remainingAllowedQty` calculation

### Finding API integration
`services/api.ts` → `useApiClient()` hook

### Finding state management
`store/cartStore.ts` → cart items + `fetchCart()`
`store/userStore.ts` → profile + role + `fetchProfile()`

### Finding screen navigation
`app/(tabs)/_layout.tsx` → tab definitions
`app/_layout.tsx` → root navigation + auth routing

---

## Synchronization Requirements

The following behaviors must be **identical** to the web app:
- Special delivery quantity limit: `remainingAllowedQty = approvedQty - currentCartQty`
- Ignoring `isOutOfRange` when approval exists
- Four cart UI states for special delivery
- Checkout collision (Resume/Start Fresh) handling
- COD vs Online payment branching
- `forceFresh` parameter on retry

When the web app changes any of these, the mobile app MUST be updated to match.

---

## Coding Standards

- **TypeScript** required for all files
- Use `className` (NativeWind) over `StyleSheet.create()`
- Use `Moti` for animations
- Use `lucide-react-native` for icons
- Use `Alert.alert()` for errors/confirmations (until a `<ToastProvider>` is added)
- Use `useFocusEffect` (not `useEffect`) for data fetching on screen focus
- Export default from screen files (Expo Router requirement)
- Named exports for utility functions, components

---

## Important Warnings

1. **Do NOT add Prisma** — mobile app must never access DB directly.
2. **Do NOT add Razorpay React Native SDK** — use WebView bridge only.
3. **Do NOT skip `fetchCart` on focus** — stale cart breaks special delivery enforcement.
4. **Do NOT hardcode API URLs** — always use `EXPO_PUBLIC_APP_URL` env variable.
5. **Do NOT skip the isCollision check** — duplicate orders cause data consistency issues.
6. **Do NOT use web-only APIs** (window, document, etc.) — React Native environment.
7. **Do NOT import from `@clerk/nextjs`** — use `@clerk/clerk-expo` exclusively.
8. **Read Expo v54 docs** before using any Expo module — API shapes change between versions.
