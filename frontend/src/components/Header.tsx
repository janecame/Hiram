import { AppBar, Badge, Box, Button, Container, Divider, IconButton, List, ListItem, ListItemText, Menu, MenuItem, Popover, Toolbar, Typography } from "@mui/material";
import { Plus, Package, LogIn, User, LayoutDashboard, ChevronDown, History, Activity, Bell, MessageSquare, List as ListIcon } from "lucide-react";
import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onList = pathname === "/list";
  const { isAuthenticated, currentUser, login, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);
  const handleNav = (path: string) => { navigate(path); handleMenuClose(); };
  const handleLogout = () => { logout(); handleMenuClose(); };

  const STATIC_NOTIFICATIONS = [
    { id: 1, text: "Juan accepted your borrow request for the Power Drill.", time: "2 min ago", unread: true },
    { id: 2, text: "Your listingCamping Tent received a new review.", time: "1 hr ago", unread: true },
    { id: 3, text: "Maria returned your DSLR Camera. Leave a review!", time: "Yesterday", unread: false },
  ];

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

          {/* Static notification and message icons — real data wired in Phase 2 */}
          {isAuthenticated && currentUser && (
            <>
              <IconButton color="primary" size="small" onClick={(e) => setNotifAnchor(e.currentTarget)}>
                <Badge badgeContent={3} color="error">
                  <Bell size={20} />
                </Badge>
              </IconButton>
              <Popover
                open={Boolean(notifAnchor)}
                anchorEl={notifAnchor}
                onClose={() => setNotifAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { mt: 1, width: 320, borderRadius: 2 } } }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary">
                    Notifications
                  </Typography>
                </Box>
                <List disablePadding>
                  {STATIC_NOTIFICATIONS.map((n, i) => (
                    <Box key={n.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          px: 2,
                          py: 1.2,
                          bgcolor: n.unread ? "rgba(28,74,58,0.05)" : "transparent",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        {n.unread && (
                          <Box
                            sx={{
                              width: 8, height: 8, borderRadius: "50%",
                              bgcolor: "error.main", mt: 0.7, mr: 1.2, flexShrink: 0,
                            }}
                          />
                        )}
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {n.text}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {n.time}
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />
                      </ListItem>
                      {i < STATIC_NOTIFICATIONS.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
                <Box sx={{ px: 2, py: 1, borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
                  <Typography variant="caption" color="primary" sx={{ cursor: "pointer", fontWeight: 600 }}>
                    See all notifications
                  </Typography>
                </Box>
              </Popover>

              <IconButton color="primary" size="small">
                <Badge badgeContent={2} color="error">
                  <MessageSquare size={20} />
                </Badge>
              </IconButton>
            </>
          )}

          {/* Phase 1 mock auth control — Phase 2 swaps for a real session menu. */}
          {isAuthenticated && currentUser ? (
            <>
              <Button
                color="primary"
                onClick={handleMenuOpen}
                startIcon={<User size={18} />}
                endIcon={<ChevronDown size={14} />}
                sx={{ fontWeight: 500 }}
              >
                {currentUser.name}
              </Button>
              <Menu
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { mt: 1, minWidth: 180 } } }}
              >
                <MenuItem onClick={() => handleNav("/dashboard")}>
                  <LayoutDashboard size={16} style={{ marginRight: 10 }} />
                  Dashboard
                </MenuItem>
                <MenuItem onClick={() => handleNav(`/profile/${encodeURIComponent(currentUser.name)}`)}>
                  <User size={16} style={{ marginRight: 10 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={() => handleNav("/my-items")}>
                  <ListIcon size={16} style={{ marginRight: 10 }} />
                  Items
                </MenuItem>
                <MenuItem onClick={() => handleNav("/history")}>
                  <History size={16} style={{ marginRight: 10 }} />
                  History
                </MenuItem>
                <MenuItem onClick={() => handleNav("/activities")}>
                  <Activity size={16} style={{ marginRight: 10 }} />
                  Activities
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                  Log out
                </MenuItem>
              </Menu>
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
