import {
  Box,
  Container,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Smartphone,
} from "lucide-react";

const COLUMNS = [
  {
    heading: "CUSTOMER SUPPORT",
    links: [
      "Help Centre",
      "Hiram Cares PH",
      "Payment Methods",
      "Order Tracking",
      "Return & Refund",
      "Hiram Guarantee",
      "Contact Us",
    ],
  },
  {
    heading: "ABOUT HIRAM",
    links: [
      "About Us",
      "Hiram Blog",
      "Hiram Careers",
      "Policies",
      "Privacy Policy",
      "Lister Centre",
      "Media Contact",
    ],
  },
];

const PAYMENT_LABELS = [
  "GCash",
  "Maya",
  "DragonPay",
  "Mastercard",
  "Visa",
  "BPI",
  "JCB",
];

const LOGISTICS_LABELS = ["LBC", "J&T Cargo", "2GO Express", "Ninja Van"];

const SOCIAL = [
  { icon: <Facebook size={18} />, label: "Facebook" },
  { icon: <Instagram size={18} />, label: "Instagram" },
  { icon: <Twitter size={18} />, label: "Twitter" },
  { icon: <Linkedin size={18} />, label: "LinkedIn" },
];

function PillBadge({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.75,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "text.secondary",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "#FFFFFF",
        pt: 5,
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {COLUMNS.map((col) => (
            <Grid item xs={12} sm={6} md={2} key={col.heading}>
              <Typography
                variant="overline"
                sx={{ fontSize: "0.65rem", color: "text.primary", display: "block", mb: 1.5 }}
              >
                {col.heading}
              </Typography>
              <Stack spacing={0.75}>
                {col.links.map((link) => (
                  <Link
                    key={link}
                    href="#"
                    underline="hover"
                    sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                  >
                    {link}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}

          {/* Payment */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="overline"
              sx={{ fontSize: "0.65rem", color: "text.primary", display: "block", mb: 1.5 }}
            >
              PAYMENT
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 0.75,
              }}
            >
              {PAYMENT_LABELS.map((p) => (
                <PillBadge key={p} label={p} />
              ))}
            </Box>

            <Typography
              variant="overline"
              sx={{ fontSize: "0.65rem", color: "text.primary", display: "block", mt: 3, mb: 1.5 }}
            >
              LOGISTICS
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 0.75,
              }}
            >
              {LOGISTICS_LABELS.map((l) => (
                <PillBadge key={l} label={l} />
              ))}
            </Box>
          </Grid>

          {/* Follow us */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="overline"
              sx={{ fontSize: "0.65rem", color: "text.primary", display: "block", mb: 1.5 }}
            >
              FOLLOW US
            </Typography>
            <Stack spacing={1}>
              {SOCIAL.map((s) => (
                <Stack key={s.label} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ color: "text.secondary" }}>{s.icon}</Box>
                  <Link href="#" underline="hover" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    {s.label}
                  </Link>
                </Stack>
              ))}
            </Stack>
          </Grid>

          {/* App download */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="overline"
              sx={{ fontSize: "0.65rem", color: "text.primary", display: "block", mb: 1.5 }}
            >
              HIRAM APP DOWNLOAD
            </Typography>
            <Stack spacing={1}>
              {["App Store", "Google Play", "AppGallery"].map((store) => (
                <Box
                  key={store}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "background.default",
                    width: "fit-content",
                    cursor: "default",
                  }}
                >
                  <Smartphone size={14} color="#5C6660" />
                  <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                    {store}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            © 2026 Hiram. All Rights Reserved.
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {["Philippines", "Indonesia", "Malaysia", "Thailand", "Vietnam", "Singapore"].map(
              (country) => (
                <Link
                  key={country}
                  href="#"
                  underline="hover"
                  sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                >
                  {country}
                </Link>
              )
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
