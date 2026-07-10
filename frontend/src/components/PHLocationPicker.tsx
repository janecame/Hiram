import { useState, useEffect, useRef } from "react";
import { Autocomplete, CircularProgress, Stack, TextField, Typography } from "@mui/material";

const PSGC_BASE = "https://psgc.gitlab.io/api";

interface PsgcEntry {
  code: string;
  name: string;
}

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .replace(/(?:^|[\s\-()])[\w]/g, (c) => c.toUpperCase());
}

function sortByName(entries: PsgcEntry[]): PsgcEntry[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name));
}

/** Match a PSGC entry by stable code first, then fall back to a case-insensitive name match (legacy rows saved before codes existed). */
function findEntry(list: PsgcEntry[], code?: string, name?: string): PsgcEntry | undefined {
  if (code) {
    const byCode = list.find((e) => e.code === code);
    if (byCode) return byCode;
  }
  if (name) {
    const lc = name.trim().toLowerCase();
    return list.find((e) => e.name.toLowerCase() === lc);
  }
  return undefined;
}

export interface PHLocationValue {
  province: string;
  city: string;
  barangay: string;
  /** Stable PSGC codes — persisted so the dropdowns can be pre-selected later. */
  provinceCode: string;
  cityCode: string;
  barangayCode: string;
}

interface PHLocationPickerProps {
  /** Emits the selected PSGC names (title-cased) and codes whenever the barangay changes. */
  onChange: (value: PHLocationValue) => void;
  error?: boolean;
  helperText?: string;
  currentArea?: string;
  /** Initial PSGC codes — cascade-loads and pre-selects the three dropdowns once. */
  initialProvinceCode?: string;
  initialCityCode?: string;
  initialBarangayCode?: string;
  /** Initial names — fallback prefill for legacy rows saved before codes existed. */
  initialProvinceName?: string;
  initialCityName?: string;
  initialBarangayName?: string;
}

export function PHLocationPicker({
  onChange,
  error,
  helperText,
  currentArea,
  initialProvinceCode,
  initialCityCode,
  initialBarangayCode,
  initialProvinceName,
  initialCityName,
  initialBarangayName,
}: PHLocationPickerProps) {
  const [provinces, setProvinces] = useState<PsgcEntry[]>([]);
  const [cities, setCities] = useState<PsgcEntry[]>([]);
  const [barangays, setBarangays] = useState<PsgcEntry[]>([]);

  const [province, setProvince] = useState<PsgcEntry | null>(null);
  const [city, setCity] = useState<PsgcEntry | null>(null);
  const [barangay, setBarangay] = useState<PsgcEntry | null>(null);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  useEffect(() => {
    fetch(`${PSGC_BASE}/provinces/`)
      .then((r) => r.json())
      .then((data: PsgcEntry[]) => setProvinces(sortByName(data)))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // One-time prefill: pick the province (by code, or by name for legacy rows),
  // then cascade-load and pre-select the city and barangay. When all three
  // resolve, emit onChange so the resolved PSGC codes are backfilled into the
  // form even when only names were stored.
  const didPrefill = useRef(false);
  useEffect(() => {
    if (didPrefill.current) return;
    if (provinces.length === 0) return;
    if (!initialProvinceCode && !initialProvinceName) return;
    const prov = findEntry(provinces, initialProvinceCode, initialProvinceName);
    if (!prov) return;
    didPrefill.current = true;
    setProvince(prov);
    setLoadingCities(true);
    fetch(`${PSGC_BASE}/provinces/${prov.code}/cities-municipalities/`)
      .then((r) => r.json())
      .then((data: PsgcEntry[]) => {
        const cityList = sortByName(data);
        setCities(cityList);
        const c = findEntry(cityList, initialCityCode, initialCityName);
        if (!c) return;
        setCity(c);
        setLoadingBarangays(true);
        fetch(`${PSGC_BASE}/cities-municipalities/${c.code}/barangays/`)
          .then((r) => r.json())
          .then((bdata: PsgcEntry[]) => {
            const bgyList = sortByName(bdata);
            setBarangays(bgyList);
            const b = findEntry(bgyList, initialBarangayCode, initialBarangayName);
            if (!b) return;
            setBarangay(b);
            // Backfill resolved codes into the form (esp. for legacy name-only rows).
            onChange({
              province: toTitleCase(prov.name),
              city: toTitleCase(c.name),
              barangay: toTitleCase(b.name),
              provinceCode: prov.code,
              cityCode: c.code,
              barangayCode: b.code,
            });
          })
          .finally(() => setLoadingBarangays(false));
      })
      .finally(() => setLoadingCities(false));
  // onChange intentionally omitted — prefill must run once, not on every parent render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces, initialProvinceCode, initialCityCode, initialBarangayCode, initialProvinceName, initialCityName, initialBarangayName]);

  function handleProvinceChange(entry: PsgcEntry | null) {
    setProvince(entry);
    setCity(null);
    setBarangay(null);
    setCities([]);
    setBarangays([]);
    if (!entry) return;
    setLoadingCities(true);
    fetch(`${PSGC_BASE}/provinces/${entry.code}/cities-municipalities/`)
      .then((r) => r.json())
      .then((data: PsgcEntry[]) => setCities(sortByName(data)))
      .finally(() => setLoadingCities(false));
  }

  function handleCityChange(entry: PsgcEntry | null) {
    setCity(entry);
    setBarangay(null);
    setBarangays([]);
    if (!entry) return;
    setLoadingBarangays(true);
    fetch(`${PSGC_BASE}/cities-municipalities/${entry.code}/barangays/`)
      .then((r) => r.json())
      .then((data: PsgcEntry[]) => setBarangays(sortByName(data)))
      .finally(() => setLoadingBarangays(false));
  }

  function handleBarangayChange(entry: PsgcEntry | null) {
    setBarangay(entry);
    if (!entry || !city || !province) return;
    onChange({
      province: toTitleCase(province.name),
      city: toTitleCase(city.name),
      barangay: toTitleCase(entry.name),
      provinceCode: province.code,
      cityCode: city.code,
      barangayCode: entry.code,
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="overline"
        color={error ? "error.main" : "text.secondary"}
      >
        Address
      </Typography>

      {currentArea && (
        <Typography variant="caption" color="text.secondary">
          Current: {currentArea}
        </Typography>
      )}

      <Autocomplete
        options={provinces}
        getOptionLabel={(o) => toTitleCase(o.name)}
        isOptionEqualToValue={(o, v) => o.code === v.code}
        value={province}
        loading={loadingProvinces}
        onChange={(_, v) => handleProvinceChange(v)}
        renderInput={(params) => <TextField {...params} label="Province" />}
      />

      <Autocomplete
        options={cities}
        getOptionLabel={(o) => toTitleCase(o.name)}
        isOptionEqualToValue={(o, v) => o.code === v.code}
        value={city}
        loading={loadingCities}
        disabled={!province}
        onChange={(_, v) => handleCityChange(v)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="City / Municipality"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loadingCities && <CircularProgress color="inherit" size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      <Autocomplete
        options={barangays}
        getOptionLabel={(o) => toTitleCase(o.name)}
        isOptionEqualToValue={(o, v) => o.code === v.code}
        value={barangay}
        loading={loadingBarangays}
        disabled={!city}
        onChange={(_, v) => handleBarangayChange(v)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Barangay"
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loadingBarangays && <CircularProgress color="inherit" size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Stack>
  );
}
