import type { User } from "../types/user";

/**
 * Seed users. Names mirror the `owner` field on MOCK_ITEMS so a profile page
 * can list "items by this user" by matching on name (until real userIds land).
 * Never imported by UI directly — goes through api/ + hooks/ like items.
 */
export const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Marco R.",
    accountType: "solo",
    email: "marco.r@example.ph",
    phone: "+63 917 555 0101",
    address: "Brgy. Villamonte, Bacolod City",
    idSubmitted: true,
    businessDocsSubmitted: false,
    createdAt: "2026-05-20T09:00:00.000Z",
  },
  {
    id: "u2",
    name: "Aira M.",
    accountType: "solo",
    email: "aira.m@example.ph",
    phone: "+63 917 555 0102",
    address: "Brgy. Mandalagan, Bacolod City",
    idSubmitted: true,
    businessDocsSubmitted: false,
    createdAt: "2026-05-22T11:30:00.000Z",
  },
  {
    id: "u3",
    name: "Chef Onyx",
    accountType: "business",
    email: "hello@onyxcatering.ph",
    phone: "+63 917 555 0103",
    address: "Brgy. Zone 14, Talisay City",
    idSubmitted: true,
    businessDocsSubmitted: true,
    createdAt: "2026-05-18T08:15:00.000Z",
  },
  {
    id: "u4",
    name: "Bea C.",
    accountType: "solo",
    email: "bea.c@example.ph",
    phone: "+63 917 555 0104",
    address: "Brgy. Poblacion, Sipalay City",
    idSubmitted: false,
    businessDocsSubmitted: false,
    createdAt: "2026-06-01T16:45:00.000Z",
  },
];
