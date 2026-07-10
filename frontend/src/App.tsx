import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { theme } from "./theme/theme";
import { AuthProvider } from "./auth/AuthContext";
import { SnackbarProvider } from "./context/SnackbarContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { TermsGate } from "./components/TermsGate";
import { BrowsePage } from "./pages/BrowsePage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { ListItemPage } from "./pages/ListItemPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DashboardPage } from "./pages/DashboardPage";
import { MyItemsPage } from "./pages/MyItemsPage";
import { EditItemPage } from "./pages/EditItemPage";
import { MessagesPage } from "./pages/MessagesPage";
import { AdminPage } from "./pages/AdminPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { TermsPage } from "./pages/TermsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function AppLayout() {
  const { pathname } = useLocation();
  const hideFooter = pathname === "/admin";
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <Header />
      <Box sx={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/list" element={<ListItemPage />} />
          <Route path="/profile/:owner" element={<ProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-items" element={<MyItemsPage />} />
          <Route path="/item/:id/edit" element={<EditItemPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      {!hideFooter && <Footer />}
      <TermsGate />
    </Box>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
