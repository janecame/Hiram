# Initial Plan — Peer-to-Peer Item Rental App

> Philippines-first · Proximity-based · Flexible pricing  
> Inspired by InDrive's peer-to-peer negotiation model

---

## Concept

A two-sided marketplace where people can **list items they own** (laptops, tools, speakers, materials, etc.) for others nearby to rent. The key differentiator is **proximity** — renters only see items close to them, down to the village/barangay level, making it convenient and hyper-local.

---

## Two-Sided Flow

### Owner / Lender
1. List an item — photo, name, category, price
2. Set pricing mode — fixed rate or open to offers
3. Receive rental requests — accept, counter, or decline
4. Hand off item — meet nearby, item tracked
5. Get paid + rated — payout on return, rate the renter

### Renter / Borrower
1. Search nearby items — filter by type, distance, price
2. View on map — see closest available items
3. Send rental offer — fixed price or propose an amount
4. Pick up item — GPS pin shared on confirmation
5. Return + review — rate the owner, close the rental

---

## Core Features

| Feature | Description |
|---|---|
| Proximity map | Village-level radius filter to show nearby items |
| Price negotiation | Owner sets fixed price or opens to offers (like InDrive) |
| Item categories | Devices, power tools, audio/AV, materials, and more |
| Trust & ratings | Star reviews + optional ID verification for both parties |
| Chat / negotiation | In-app messaging to agree on terms before confirming |
| GPS pin sharing | Exact meetup location shared only after deal is confirmed |

---

## Item Categories (MVP)

- **Devices** — laptops, tablets, cameras, projectors
- **Power tools** — drills, grinders, saws
- **Materials** — lumber, scaffolding, plumbing parts
- **Audio / AV** — speakers, microphones, mixers
- *(more categories added in later phases)*

---

## Pricing Model

- **Fixed price** — owner sets a rate per hour/day, renter pays as listed
- **Negotiable** — owner opens the listing to offers; both parties agree before confirming

---

## Suggested Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native / Expo |
| Backend API | Node.js / Express + TypeScript |
| Database | Supabase + PostGIS (geo queries) |
| Maps / location | Mapbox or Google Maps |
| Auth | Supabase Auth |
| Real-time chat | Supabase Realtime |

> **Why PostGIS?** Enables "find all items within X km of me" as a single SQL query — no separate geo service needed.

---

## Target Market

- **Phase 1** — Philippines only (local-first)
- **Phase 2** — Southeast Asia regional expansion
- **Phase 3** — Global

---

## Next Steps

- [ ] Define MVP feature scope vs phase 2 features
- [ ] Design key screens (map view, item listing, chat + negotiation)
- [ ] Design database schema (users, items, rentals, offers, reviews)
- [ ] Define business model (commission per rental, premium listings, etc.)
- [ ] Prototype the proximity map and listing flow

---

*Created: June 2026*
