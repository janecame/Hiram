# Tools & Configuration Reference
## Peer-to-Peer Item Rental App

> Cost · Free Tier · Registration · Configuration — at a glance

---

## Platform & Frontend

| Tool | Cost | Free Tier | Registration | Configuration |
|---|---|---|---|---|
| React Native + Expo | Free | Fully free | Expo account for EAS builds | Install Node.js + Expo CLI, configure app.json |
| Expo EAS Build | Freemium | 30 builds/month | expo.dev account | Run eas build:configure, set bundle ID |
| React Native Paper | Free | Fully free | None | Wrap app in PaperProvider |
| Expo Router | Free | Fully free | None | File-based — organize screens under /app folder |
| React Hook Form + Zod | Free | Fully free | None | Same setup as web — no changes needed |
| TanStack Query | Free | Fully free | None | Wrap app in QueryClientProvider |

---

## Backend

| Tool | Cost | Free Tier | Registration | Configuration |
|---|---|---|---|---|
| Node.js + Express | Free | Fully free | None | Standard TypeScript project setup |
| Railway | Freemium | Free tier available (limited) | railway.app — GitHub login | Connect GitHub repo, set env vars in dashboard |

---

## Database & Real-time

| Tool | Cost | Free Tier | Registration | Configuration |
|---|---|---|---|---|
| Supabase | Freemium | 2 projects, 500MB DB, 2GB bandwidth | supabase.com — GitHub login | Create project, copy URL + keys to .env |
| PostGIS | Free | Fully free | None | Enable via Supabase dashboard → Extensions |
| Supabase Realtime | Free | Included in Supabase | Included in Supabase account | Subscribe to table changes per rental channel |
| Supabase Storage | Freemium | 50MB free, ~$0.021/GB after | Included in Supabase account | Create bucket, set public/private access policy |

---

## Maps & Location

| Tool | Cost | Free Tier | Registration | Configuration |
|---|---|---|---|---|
| Mapbox GL *(recommended)* | Freemium | 50,000 map loads/month | mapbox.com — CC required even on free tier | Get access token, add to app.json + .env |
| Google Maps SDK *(alternative)* | Freemium | $200 credit/month (~28k loads) | Google Cloud Console — billing + CC required | Enable SDK, generate API key, restrict by bundle ID |
| Google Places API | Paid | Under $200 credit, ~$17/1k after | Same Google Cloud account | Enable Places API separately in GCP console |
| Expo Location | Free | Fully free | None | Add location permissions to app.json |

---

## Auth & Security

| Tool | Cost | Free Tier | Registration | Configuration |
|---|---|---|---|---|
| Supabase Auth | Free | Up to 50,000 MAUs | Included in Supabase account | Enable providers, set up RLS policies on all tables |
| Google OAuth | Free | Free | GCP console — create OAuth 2.0 credentials | Paste Client ID + Secret into Supabase Auth dashboard |

---

## App Store Distribution

| Tool | Cost | Free Tier | Registration | Configuration |
|---|---|---|---|---|
| Apple Developer Program | **$99 USD/year** | None | developer.apple.com — 1–2 days approval | Create App ID, set up via EAS or App Store Connect |
| Google Play Console | **$25 USD one-time** | None | play.google.com/console | Create app listing, upload signed AAB via EAS |

---

## Push Notifications

| Tool | Cost | Free Tier | Registration | Configuration |
|---|---|---|---|---|
| Expo Push Notifications | Freemium | 1,000 recipients/month free | Expo account + FCM + APNs credentials | Register push token per user, save to Supabase |
| Firebase Cloud Messaging | Free | Fully free | console.firebase.google.com | Add Server Key to Expo dashboard credentials |

---

## Cost Summary

| | Cost |
|---|---|
| Android launch (minimum) | **$25 USD** one-time |
| iOS + Android launch | **$124 USD** first year, then $99/year |
| Monthly running cost (MVP) | **~$5 USD/month** (Railway hobby plan) |

---

*Created: June 2026 — Suporae*
