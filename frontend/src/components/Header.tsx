import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Plus, Package, LogIn, User } from "lucide-react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Header() {
  const { pathname } = useLocation();
  const onList = pathname === "/list";
  const { isAuthenticated, currentUser, login, logout } = useAuth();

  return (
    <AppBar
      position="sticky"
      sx={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(250,247,242,0.85)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "primary.main",
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "2px dashed",
                borderColor: "secondary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "secondary.main",
              }}
            >
              <Package size={18} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ lineHeight: 1, fontSize: 22 }}
                color="primary"
              >
                Hiram
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: 9, color: "text.secondary" }}
              >
                borrow what's near
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            component={RouterLink}
            to="/"
            color="primary"
            sx={{ fontWeight: pathname === "/" ? 700 : 500 }}
          >
            Browse
          </Button>
          <Button
            component={RouterLink}
            to="/list"
            variant={onList ? "contained" : "outlined"}
            color="secondary"
            startIcon={<Plus size={18} />}
          >
            List an item
          </Button>

          {/* Phase 1 mock auth control — Phase 2 swaps for a real session menu. */}
          {isAuthenticated && currentUser ? (
            <>
              <Button
                component={RouterLink}
                to={`/profile/${encodeURIComponent(currentUser.name)}`}
                color="primary"
                startIcon={<User size={18} />}
                sx={{ fontWeight: pathname.startsWith("/profile") ? 700 : 500 }}
              >
                {currentUser.name}
              </Button>
              <Button color="primary" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <Button color="primary" startIcon={<LogIn size={18} />} onClick={login}>
              Log in
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
