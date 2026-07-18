import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, ClipboardList, MessageCircle, Pencil, User } from "lucide-react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useItem } from "../hooks/useItem";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from "../types/item";
import { formatDistance, formatPeso, haversineKm } from "../lib/format";
import { CategoryBlock } from "../components/CategoryBlock";
import { StampBadge } from "../components/StampBadge";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { ReviewsSection } from "../components/ReviewsSection";
import { ChatPopup } from "../components/ChatPopup";
import { RequestForm } from "../components/RequestForm";
import { LocationMap, RouteMap } from "../components/LocationPicker";

const SESSION_KEY = "hiram_user_coords";

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as { lat: number; lng: number }) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setImageFailed(false);
  }, [id]);

  // Request location only if not already cached from Browse page.
  useEffect(() => {
    if (userCoords || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(c);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(c));
      },
      () => {}
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute distance on the frontend — item already returns lat/lng from the DB.
  // Falls back to distanceKm already on the item (set by Browse page query).
  const computedDistance =
    userCoords != null && item?.lat != null && item?.lng != null
      ? haversineKm(userCoords.lat, userCoords.lng, item.lat, item.lng)
      : item?.distanceKm ?? null;

  // Road route from the borrower to the item, via the OSRM demo server.
  // ⚠️ router.project-osrm.org is a demo server — swap to hosted OSRM in a later phase.
  const [route, setRoute] = useState<{
    points: [number, number][];
    distanceKm: number;
    durationMin: number;
  } | null>(null);

  const hasRouteEnds =
    userCoords != null && item?.lat != null && item?.lng != null;
  const itemLat = item?.lat;
  const itemLng = item?.lng;

  useEffect(() => {
    if (!hasRouteEnds || userCoords == null || itemLat == null || itemLng == null)
      return;
    let cancelled = false;
    const url = `https://router.project-osrm.org/route/v1/driving/${userCoords.lng},${userCoords.lat};${itemLng},${itemLat}?overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data: {
        routes?: Array<{
          geometry: { coordinates: [number, number][] };
          distance: number;
          duration: number;
        }>;
      }) => {
        if (cancelled) return;
        const r = data.routes?.[0];
        if (!r) return;
        setRoute({
          // GeoJSON is [lng, lat] — Leaflet wants [lat, lng].
          points: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          distanceKm: r.distance / 1000,
          durationMin: r.duration / 60,
        });
      })
      .catch(() => {
        // OSRM failed — RouteMap falls back to a straight line + haversine.
      });
    return () => {
      cancelled = true;
    };
  }, [hasRouteEnds, userCoords, itemLat, itemLng]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back
      </Button>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress color="primary" />
        </Stack>
      ) : !item ? (
        <EmptyState
          title="Item not found"
          message="This listing may have been removed."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
            alignItems: "start",
          }}
        >
          <Box
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              position: { md: "sticky" },
              top: { md: 88 },
            }}
          >
            {item.imageUrl && !imageFailed ? (
              <Box
                component="img"
                src={item.imageUrl}
                alt={item.title}
                onError={() => setImageFailed(true)}
                sx={{ display: "block", width: "100%", height: 360, objectFit: "cover", borderRadius: 2 }}
              />
            ) : (
              <CategoryBlock category={item.category} height={360} iconSize={96} />
            )}
          </Box>

          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={CATEGORY_LABELS[item.category]}
                variant="outlined"
                color="primary"
              />
              <Chip
                label={CONDITION_LABELS[item.condition]}
                variant="outlined"
              />
              <StatusBadge status={item.status} />
            </Stack>

            <Typography variant="h3" component="h1">
              {item.title}
            </Typography>

            {item.brand && (
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                {item.brand}
              </Typography>
            )}

            <Stack direction="row" spacing={2} sx={{ my: 1 }}>
              <StampBadge
                label="Per day"
                value={formatPeso(item.pricePerDay)}
                color="#C94A2A"
              />
              {computedDistance != null && (
                <StampBadge
                  label="Distance"
                  value={`${computedDistance.toFixed(1)}km`}
                  color="#1C4A3A"
                />
              )}
            </Stack>

            {typeof item.pricePerHour === "number" && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Also available hourly at{" "}
                <Box
                  component="span"
                  sx={{
                    color: "secondary.main",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {formatPeso(item.pricePerHour)}
                </Box>{" "}
                / hour
              </Typography>
            )}

            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
              {item.description}
            </Typography>

            <Divider />

            <Stack spacing={1}>
              <Row
                label="Area"
                value={
                  computedDistance != null
                    ? `${item.area} · ${formatDistance(computedDistance)}`
                    : item.area
                }
              />
              <Stack direction="row" alignItems="center" spacing={1}>
                <User size={16} />
                <Typography variant="body2" color="text.secondary">
                  Listed by{" "}
                  <Link
                    component={RouterLink}
                    to={`/profile/${encodeURIComponent(item.owner)}`}
                    color="primary"
                    fontWeight={600}
                  >
                    {item.owner}
                  </Link>
                </Typography>
                {currentUser?.name !== item.owner && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setChatOpen(true)}
                    title={`Message ${item.owner}`}
                    sx={{ ml: 0.5, p: 0.5 }}
                  >
                    <MessageCircle size={16} />
                  </IconButton>
                )}
              </Stack>
            </Stack>

            {item.requirements && (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ClipboardList size={18} />
                    <Typography variant="h6" component="h2">
                      Requirements to borrow
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", lineHeight: 1.7, whiteSpace: "pre-line" }}
                  >
                    {item.requirements}
                  </Typography>
                </Stack>
              </>
            )}

            <Divider />

            {currentUser?.name === item.owner ? (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<Pencil size={18} />}
                onClick={() => navigate(`/item/${item.id}/edit`)}
              >
                Edit listing
              </Button>
            ) : (
              item.status === "available" && (
                <>
                  <Divider />
                  <RequestForm item={item} />
                </>
              )
            )}

            {item.lat != null && item.lng != null && (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Typography variant="h6" component="h2">
                    Pickup Location
                  </Typography>
                  {userCoords != null ? (
                    <>
                      <RouteMap
                        from={userCoords}
                        to={{ lat: item.lat, lng: item.lng }}
                        route={route?.points}
                      />
                      <Typography variant="overline" color="text.secondary">
                        {route != null
                          ? `≈ ${route.distanceKm.toFixed(1)} km · ${Math.round(
                              route.durationMin
                            )} min driving`
                          : computedDistance != null
                          ? `≈ ${computedDistance.toFixed(1)} km away (straight line)`
                          : "Route unavailable"}
                      </Typography>
                    </>
                  ) : (
                    <LocationMap lat={item.lat} lng={item.lng} />
                  )}
                </Stack>
              </>
            )}

            <Divider />

            <ReviewsSection itemId={item.id} rating={item.rating} />
          </Stack>
        </Box>
      )}

      {item && currentUser?.name !== item.owner && (
        <ChatPopup
          owner={item.owner}
          itemId={item.id}
          listerId={item.ownerId}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 64 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}
