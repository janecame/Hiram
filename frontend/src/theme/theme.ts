import { createTheme } from "@mui/material/styles";

// ── Hiram palette ──
const PAPER = "#FAF7F2"; // warm paper background
const PINE = "#1C4A3A"; // deep pine green — primary
const RUST = "#C94A2A"; // rust-orange — CTAs / accent
const AMBER = "#E8A020"; // amber — highlights

const DISPLAY = '"Archivo", system-ui, sans-serif';
const BODY = '"Inter", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: PINE, contrastText: "#FFFFFF" },
    secondary: { main: RUST, contrastText: "#FFFFFF" },
    warning: { main: AMBER },
    background: { default: PAPER, paper: "#FFFFFF" },
    text: { primary: "#1F2421", secondary: "#5C6660" },
    divider: "rgba(28,74,58,0.16)",
  },
  typography: {
    fontFamily: BODY,
    h1: { fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontFamily: DISPLAY, fontWeight: 700 },
    h5: { fontFamily: DISPLAY, fontWeight: 700 },
    h6: { fontFamily: DISPLAY, fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },
    // Mono variant for prices, labels, tags.
    overline: {
      fontFamily: MONO,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    caption: { fontFamily: MONO, letterSpacing: "0.02em" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: MONO, fontWeight: 600, letterSpacing: "0.02em" },
        outlined: { borderWidth: 1.5 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
    },
  },
});
