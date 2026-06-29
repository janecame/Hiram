# Hiram — Roadmap Status

## [✅] Phase 1 — Core MVP
- [✅] JWT auth (register / login)
- [✅] Item listing (create / edit / archive / delete)
- [✅] Browse & item detail (filters, categories)
- [✅] Borrow request flow (pending → approved → return_requested → completed)
- [✅] User profiles
- [✅] Reviews (borrower reviews item after completed rental)
- [✅] Image uploads (S3 pre-signed URL)

## [✅] Phase 2 — Real Infrastructure & Social Features
- [✅] PostgreSQL on AWS RDS (migrated from mock data)
- [✅] PostGIS distance calculation (ST_Distance on Browse)
- [✅] Real-time chat (Socket.io, conversations + messages)
- [✅] Notifications (Socket.io push + REST fallback)
- [✅] Admin panel (stats, user/item management, ID verification)
- [✅] ID / credential verification flow (upload → pending → verified / rejected)
- [✅] Overlap-aware auto-decline (double-booking fix)
- [✅] Counter-offer flow (lister proposes new dates, borrower accepts/declines)
- [✅] PSGC address fields (province / city / barangay columns)

## [🔲] Phase 3 — Location & Routing
- [🔲] Geolocation revision — manual PSGC address + map pin in listing form
- [🔲] OSRM road directions on Item Detail page (driving distance + ETA + route polyline)

## [🔲] Phase 4 — Payments & Claims
- [🔲] PayMongo integration (GCash, Maya, card payments)
- [🔲] Damage claims (lister files claim post-rental; admin review; notifications)
