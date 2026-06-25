import { useState, useEffect } from "react";
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

export interface PHLocationValue {
  province: string;
  city: string;
  barangay: string;
}

interface PHLocationPickerProps {
  /** Emits the selected PSGC names (title-cased) whenever the barangay changes. */
  onChange: (value: PHLocationValue) => void;
  error?: boolean;
  helperText?: string;
  currentArea?: string;
}

export function PHLocationPicker({
  onChange,
  error,
  helperText,
  currentArea,
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
      .then((data: PsgcEntry[]) =>
        setProvinces(data.sort((a, b) => a.name.localeCompare(b.name)))
      )
      .finally(() => setLoadingProvinces(false));
  }, []);

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
      .then((data: PsgcEntry[]) =>
        setCities(data.sort((a, b) => a.name.localeCompare(b.name)))
      )
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
      .then((data: PsgcEntry[]) =>
        setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)))
      )
      .finally(() => setLoadingBarangays(false));
  }

  function handleBarangayChange(entry: PsgcEntry | null) {
    setBarangay(entry);
    if (!entry || !city || !province) return;
    onChange({
      province: toTitleCase(province.name),
      city: toTitleCase(city.name),
      barangay: toTitleCase(entry.name),
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
        value={province}
        loading={loadingProvinces}
        onChange={(_, v) => handleProvinceChange(v)}
        renderInput={(params) => <TextField {...params} label="Province" />}
      />

      <Autocomplete
        options={cities}
        getOptionLabel={(o) => toTitleCase(o.name)}
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
