# Plan: Geolocation Auto-Fill & Live Distance Feature

## Goal

1. **Lister side**: When someone lists or edits an item, capture the precise GPS coordinates (`lat`/`lng`) of the item location — either via a "Detect my location" button or automatically after they pick a barangay in the PHLocationPicker.
2. **Browse page**: Each `ItemCard` shows the distance from the borrower's live location to the item (e.g., "2.3 km away"). Already partially wired — only missing because listed items have no `lat`/`lng` stored yet.
3. **Item detail page**: The detail view shows how far the item is from the borrower's current position, computed on the frontend using Haversine (no backend change needed — item already returns `lat`/`lng`).

---

## Current State (read before implementing)

### What already works — do not touch

| Already wired | Where |
|---|---|
| `Item` type has optional `lat` and `lng` fields | `frontend/src/types/item.ts:28-29` |
| `itemFormSchema` has `lat`/`lng` optional fields | `frontend/src/schemas/item-form.ts:60-62` |
| `ListItemPage` form passes `lat`/`lng` in `onSubmit` | `frontend/src/pages/ListItemPage.tsx:108-109` |
| `BrowsePage` already calls `navigator.geolocation` and passes `userLat`/`userLng` to `useItems` | `frontend/src/pages/BrowsePage.tsx:31-53` |
| `api/items.ts` → `listItems` already sends `userLat`/`userLng` to the backend | `frontend/src/api/items.ts:45-46` |
| Backend `ItemModel.findAll` uses PostGIS `ST_Distance` to compute `distance_km` when coords present | `backend/src/models/item.model.ts:117-128` |
| Backend `ItemModel.create` stores `lat`/`lng` as PostGIS `geography` | `backend/src/models/item.model.ts:241-266` |
| Backend `ItemModel.findById` returns `lat`/`lng` from `ST_Y`/`ST_X` | `backend/src/models/item.model.ts:159-170` |
| `ItemCard` renders distance if `item.distanceKm != null` | `frontend/src/components/ItemCard.tsx:101-104` |
| `ItemDetailPage` renders `StampBadge` distance if `item.distanceKm != null` | `frontend/src/pages/ItemDetailPage.tsx:121-128` |
| `LocationPicker` (clickable map) and `LocationMap` (read-only map) components exist | `frontend/src/components/LocationPicker.tsx` |

### The core problem

Items are created without `lat`/`lng` because:
- `PHLocationPicker` only emits a human-readable `area` string (e.g., "Mandalagan, Bacolod City"). It never calls `setValue("lat", ...)` or `setValue("lng", ...)`.
- The "Detect my location" auto-fill has never been built.
- Result: all items stored with `location = NULL` in DB → PostGIS can't compute distance → `distanceKm` is always `undefined` → cards never show distance.

### What needs to be built

1. A `useUserLocation` hook — reusable geolocation hook for Browse and Detail pages
2. PHLocationPicker — extend to emit `lat`/`lng` alongside the area string via Nominatim forward geocoding
3. ListItemPage — add "Detect my location" button that auto-fills `lat`/`lng` + `area`
4. EditItemPage — same button + same PHLocationPicker wiring
5. ItemDetailPage — add Haversine distance computation on the frontend (no backend change needed)
6. BrowsePage — minor UX improvement: show a "Enable location" nudge when sort is "nearest" but permission was denied

---

## Implementation Steps

### Step 1 — `useUserLocation` hook

**File**: `frontend/src/hooks/useUserLocation.ts` (new file)

**Purpose**: Encapsulates `navigator.geolocation.getCurrentPosition` with loading/granted/denied states. Currently BrowsePage has this logic inline; extract it so it can be shared.

**Shape**:
```ts
type LocationStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

interface UseUserLocationResult {
  coords: { lat: number; lng: number } | null;
  status: LocationStatus;
  request: () => void; // call to trigger the browser permission prompt
}

export function useUserLocation(): UseUserLocationResult
```

- On mount: do NOT auto-request. Set status to `"idle"`.
- `request()`: sets status to `"loading"`, calls `navigator.geolocation.getCurrentPosition`.
- On success: sets `coords` and `status = "granted"`.
- On error: sets `status = "denied"`.
- If `!navigator.geolocation`: sets `status = "unsupported"` immediately.
- Store granted coords in `sessionStorage` under key `"hiram_user_coords"` so the detail page can read them without re-prompting.

---

### Step 2 — BrowsePage: use `useUserLocation` hook + location UX

**File**: `frontend/src/pages/BrowsePage.tsx`

**Changes**:
1. Replace the inline `useState`/`useEffect` geolocation block (lines 31–39) with `useUserLocation()`.
2. Call `request()` automatically on mount (same behaviour as current `getCurrentPosition` call — silent background prompt).
3. Add a small info chip below the FilterBar when `status === "denied"` and `sort === "nearest"`:
   - Text: "Enable location to sort by distance"
   - Color: `"default"` (grey, not alarming)
   - No action needed — just informational.

---

### Step 3 — PHLocationPicker: emit lat/lng via Nominatim forward geocoding

**File**: `frontend/src/components/PHLocationPicker.tsx`

**New prop**:
```ts
interface PHLocationPickerProps {
  onChange: (area: string) => void;
  onCoordsChange?: (lat: number, lng: number) => void; // NEW — optional
  error?: boolean;
  helperText?: string;
  currentArea?: string;
}
```

**Logic in `handleBarangayChange`** (currently line 81–85):
After calling `onChange(areaString)`, if `onCoordsChange` is provided:
1. Build a Nominatim search query: `barangay.name + ", " + city.name + ", Philippines"`
2. Fetch: `https://nominatim.openstreetmap.org/search?q=ENCODED_QUERY&format=json&limit=1&countrycodes=ph`
   - Set `User-Agent: "Hiram/1.0"` header (Nominatim policy requirement)
3. If result has `[0].lat` and `[0].lon` → call `onCoordsChange(parseFloat(lat), parseFloat(lon))`
4. If no result → silently skip (coords remain unset; the "Detect" button is the backup)
5. Add a local `setCoordsLoading` state to show a subtle spinner next to the barangay field during the fetch.

**Why Nominatim**: Free, no API key, reasonable accuracy at city/barangay level in the Philippines, existing project already uses OSM tiles in `LocationPicker.tsx`.

---

### Step 4 — ListItemPage: "Detect my location" button + wire PHLocationPicker coords

**File**: `frontend/src/pages/ListItemPage.tsx`

**4a — Geolocation detect button**

Add above the `<PHLocationPicker>` block (currently line 306–310):

```tsx
<Stack spacing={1}>
  <Button
    type="button"
    variant="outlined"
    color="primary"
    size="small"
    startIcon={<LocateFixed size={16} />}   // lucide-react icon
    onClick={handleDetectLocation}
    disabled={detectStatus === "loading"}
  >
    {detectStatus === "loading" ? "Detecting…" : "Use my current location"}
  </Button>
  {detectStatus === "denied" && (
    <Typography variant="caption" color="error">
      Location permission denied. Pick a barangay manually below.
    </Typography>
  )}
</Stack>
```

**`handleDetectLocation` function**:
```ts
async function handleDetectLocation() {
  setDetectStatus("loading");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setValue("lat", lat);
      setValue("lng", lng);
      // Reverse geocode to suggest an area string
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "User-Agent": "Hiram/1.0" } }
      );
      const data = await res.json();
      const suburb = data.address?.suburb ?? data.address?.village ?? "";
      const city = data.address?.city ?? data.address?.municipality ?? "";
      if (suburb || city) {
        const area = [suburb, city].filter(Boolean).join(", ");
        setValue("area", area, { shouldValidate: true });
      }
      setDetectStatus("granted");
    },
    () => setDetectStatus("denied")
  );
}
```

**4b — Wire PHLocationPicker `onCoordsChange`**

Update the `<PHLocationPicker>` call (currently line 306–310):
```tsx
<PHLocationPicker
  onChange={(area) => setValue("area", area, { shouldValidate: true })}
  onCoordsChange={(lat, lng) => {        // NEW
    setValue("lat", lat);
    setValue("lng", lng);
  }}
  error={Boolean(errors.area)}
  helperText={errors.area?.message ?? "Select the barangay where borrowers pick up the item."}
/>
```

**State to add**:
```ts
const [detectStatus, setDetectStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
```

**Import to add**: `LocateFixed` from `lucide-react`.

---

### Step 5 — EditItemPage: same changes as ListItemPage

**File**: `frontend/src/pages/EditItemPage.tsx`

Apply identical changes from Step 4:
- Add `detectStatus` state
- Add `handleDetectLocation` function
- Add detect button above PHLocationPicker
- Add `onCoordsChange` prop to PHLocationPicker

The `setValue("lat", ...)` / `setValue("lng", ...)` calls work the same way since EditItemPage uses the same `useForm<ItemFormValues>` setup.

---

### Step 6 — ItemDetailPage: Haversine distance on the frontend

**File**: `frontend/src/pages/ItemDetailPage.tsx`

**Why not backend**: The backend `findById` already returns `item.lat` and `item.lng`. Computing distance in the frontend avoids adding `?userLat&userLng` query params to `GET /api/items/:id`, touching the controller, and expanding the model query. For Phase 1 this is the right call.

**6a — Add Haversine utility to `frontend/src/lib/format.ts`**

```ts
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

**6b — Read user coords from sessionStorage in ItemDetailPage**

In `ItemDetailPage`:
```ts
const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
  const stored = sessionStorage.getItem("hiram_user_coords");
  return stored ? JSON.parse(stored) : null;
});

useEffect(() => {
  if (userCoords || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(coords);
      sessionStorage.setItem("hiram_user_coords", JSON.stringify(coords));
    },
    () => {}
  );
}, []);
```

**6c — Compute and display distance**

```ts
const distanceKm =
  userCoords && item?.lat != null && item?.lng != null
    ? haversineKm(userCoords.lat, userCoords.lng, item.lat, item.lng)
    : item?.distanceKm ?? null;
```

Replace the existing `item.distanceKm` references in the JSX (lines 121–128 and 157–159) with `distanceKm`.

The `useUserLocation` hook (Step 1) writes to `sessionStorage` on grant. If the user already granted on BrowsePage, their coords are already stored → ItemDetailPage reads them instantly without re-prompting.

---

## Data flow summary (after implementation)

```
Lister:
  "Detect" button → navigator.geolocation → lat/lng set on form
  PHLocationPicker selects barangay → Nominatim forward geocode → lat/lng set on form
  onSubmit → POST /api/items with lat/lng → ST_MakePoint stored in DB

Borrower (Browse):
  BrowsePage mounts → navigator.geolocation → coords stored in sessionStorage
  useItems({ userLat, userLng }) → GET /api/items?userLat=&userLng=
  Backend: ST_Distance(item.location, user.point) → distanceKm per item
  ItemCard renders distanceKm if present

Borrower (Detail):
  ItemDetailPage reads sessionStorage coords (already set by BrowsePage)
  getItem(id) returns item with lat/lng
  Frontend Haversine(userCoords, item.lat, item.lng) → distanceKm
  StampBadge renders distance
```

---

## Files to create / modify

| File | Action | Summary |
|---|---|---|
| `frontend/src/hooks/useUserLocation.ts` | **Create** | Geolocation hook with status + sessionStorage caching |
| `frontend/src/lib/format.ts` | **Edit** | Add `haversineKm()` utility |
| `frontend/src/components/PHLocationPicker.tsx` | **Edit** | Add `onCoordsChange` prop + Nominatim forward geocode call |
| `frontend/src/pages/ListItemPage.tsx` | **Edit** | "Detect my location" button + wire `onCoordsChange` |
| `frontend/src/pages/EditItemPage.tsx` | **Edit** | Same as ListItemPage |
| `frontend/src/pages/BrowsePage.tsx` | **Edit** | Use `useUserLocation` hook; add denied location UX |
| `frontend/src/pages/ItemDetailPage.tsx` | **Edit** | Haversine distance + read sessionStorage coords |

**No backend changes required.**

---

## Out of scope for this plan

- Map picker in the listing form (the `LocationPicker` click-on-map component exists but is not wired in — defer to a later task)
- PostGIS distance on `GET /api/items/:id` (Haversine on frontend is sufficient for Phase 1)
- Storing user coords in React context (sessionStorage is enough; no prop drilling needed)
- Location permission UI on the Header/global level