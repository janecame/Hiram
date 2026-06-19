# Phase 5 — Mobile App (React Native / Expo)

**Goal:** Ship a native iOS and Android app that runs on the same backend as the web app.

---

## Approach

- **React Native + Expo** — shared TypeScript codebase for iOS and Android
- Shares the same Express + Supabase backend from Phases 2–4 (no backend changes)
- `src/api/items.ts` contract is identical — the mobile app calls the same endpoints
- UI components are rebuilt in React Native (MUI does not apply); design tokens (colors, typography) are ported to a React Native theme

---

## Features (parity with web)

- Browse items with category filter and sort
- Item detail page with status, duration selector, borrow request
- Real-time chat (Supabase Realtime)
- Rental calendar
- User profile with credentials
- Payments (same PayMongo integration via backend)
- Ratings and reviews

### Mobile-native additions
- Push notifications (Expo Notifications + FCM / APNs) for request updates, messages, payment events
- Native map (React Native Maps + Mapbox) for browse and listing
- Camera access for image upload and credential photo capture
- Background location (optional — for automatic distance calculation)

---

## Project structure addition

```
hiram-monorepo/
  mobile/               — new Expo workspace
    src/
      api/              — same contract as frontend/src/api/ (shared by convention)
      hooks/            — same TanStack Query wrappers (copy or shared package)
      screens/          — equivalent of pages/
      components/       — RN equivalents of web components
      theme/            — RN StyleSheet tokens matching web design tokens
```

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo (managed workflow) |
| Navigation | React Navigation v6 |
| State / data | TanStack Query (same as web) |
| Maps | React Native Maps + Mapbox |
| Notifications | Expo Notifications |
| Payments | PayMongo WebView or deep link (same backend) |
| OTA updates | Expo Updates |

---

## Deployment

- iOS — App Store (Apple Developer account required)
- Android — Google Play Store
- OTA JS updates via Expo Updates (no store review for JS-only changes)