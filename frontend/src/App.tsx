import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { theme } from "./theme/theme";
import { AuthProvider } from "./auth/AuthContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { BrowsePage } from "./pages/BrowsePage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { ListItemPage } from "./pages/ListItemPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DashboardPage } from "./pages/DashboardPage";
import { MyItemsPage } from "./pages/MyItemsPage";
import { EditItemPage } from "./pages/EditItemPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
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
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
              <Footer />
            </Box>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
