import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png?url";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png?url";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png?url";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import { Box, Stack, Typography } from "@mui/material";

// Fix Vite bundling stripping Leaflet's default marker icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

// Philippines geographic center — default map position for new listings
const PH_CENTER: [number, number] = [12.0, 122.5];

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  error?: boolean;
  helperText?: string;
}

export function LocationPicker({
  lat,
  lng,
  onChange,
  error,
  helperText,
}: LocationPickerProps) {
  const hasPin = lat != null && lng != null;
  const center: [number, number] = hasPin ? [lat, lng] : PH_CENTER;

  return (
    <Stack spacing={0.5}>
      <Typography
        variant="overline"
        color={error ? "error.main" : "text.secondary"}
      >
        Item Location
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Click on the map or drag the pin to set the exact pickup location.
      </Typography>
      <Box
        sx={{
          height: 300,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: error ? "error.main" : "divider",
        }}
      >
        <MapContainer
          center={center}
          zoom={hasPin ? 13 : 6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onClick={onChange} />
          {hasPin && (
            <Marker
              position={[lat, lng]}
              draggable
              eventHandlers={{
                dragend(e) {
                  const pos = (e.target as L.Marker).getLatLng();
                  onChange(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </Box>
      {helperText && (
        <Typography variant="caption" color={error ? "error" : "text.secondary"}>
          {helperText}
        </Typography>
      )}
    </Stack>
  );
}

interface LocationMapProps {
  lat: number;
  lng: number;
}

export function LocationMap({ lat, lng }: LocationMapProps) {
  return (
    <Box
      sx={{
        height: 240,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </Box>
  );
}

/** Fits the map to show every point in `bounds` whenever they change. */
function FitBounds({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length < 2) return;
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, bounds]);
  return null;
}

interface RouteMapProps {
  /** Borrower location */
  from: { lat: number; lng: number };
  /** Item pickup location */
  to: { lat: number; lng: number };
  /** Route geometry as [lat, lng] points; falls back to a straight line. */
  route?: [number, number][];
}

export function RouteMap({ from, to, route }: RouteMapProps) {
  const line: [number, number][] =
    route && route.length > 1
      ? route
      : [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ];

  return (
    <Box
      sx={{
        height: 280,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <MapContainer
        center={[to.lat, to.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[from.lat, from.lng]} />
        <Marker position={[to.lat, to.lng]} />
        <Polyline positions={line} pathOptions={{ color: "#C94A2A", weight: 4 }} />
        <FitBounds bounds={line} />
      </MapContainer>
    </Box>
  );
}
