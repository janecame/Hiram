import { AppBar, Badge, Box, Button, Container, Divider, IconButton, List, ListItem, ListItemText, Menu, MenuItem, Popover, Toolbar, Typography } from "@mui/material";
import { Plus, Package, LogIn, User, LayoutDashboard, ChevronDown, History, Activity, Bell, MessageSquare, List as ListIcon } from "lucide-react";
import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from "../hooks/useNotifications";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useSocket } from "../hooks/useSocket";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onList = pathname === "/list";
  const { isAuthenticated, currentUser, login, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  useSocket();

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);
  const handleNav = (path: string) => { navigate(path); handleMenuClose(); };
  const handleLogout = () => { logout(); handleMenuClose(); };

  const handleNotifClick = (id: string, requestId?: string) => {
    markRead.mutate(id);
    if (requestId) navigate("/dashboard");
    setNotifAnchor(null);
  };

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

          {isAuthenticated && currentUser && (
            <>
              <IconButton color="primary" size="small" onClick={(e) => setNotifAnchor(e.currentTarget)}>
                <Badge badgeContent={unreadCount || undefined} color="error">
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
                <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary">
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Typography
                      variant="caption"
                      color="secondary"
                      sx={{ cursor: "pointer", fontWeight: 600 }}
                      onClick={() => markAllRead.mutate()}
                    >
                      Mark all read
                    </Typography>
                  )}
                </Box>
                <List disablePadding>
                  {notifications.length === 0 ? (
                    <ListItem sx={{ px: 2, py: 2 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary" textAlign="center">
                            No notifications yet
                          </Typography>
                        }
                      />
                    </ListItem>
                  ) : (
                    notifications.map((n, i) => (
                      <Box key={n.id}>
                        <ListItem
                          alignItems="flex-start"
                          onClick={() => handleNotifClick(n.id, n.requestId)}
                          sx={{
                            px: 2,
                            py: 1.2,
                            bgcolor: !n.read ? "rgba(28,74,58,0.05)" : "transparent",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          {!n.read && (
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
                                {n.message}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {timeAgo(n.createdAt)}
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </ListItem>
                        {i < notifications.length - 1 && <Divider />}
                      </Box>
                    ))
                  )}
                </List>
                <Box sx={{ px: 2, py: 1, borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ cursor: "pointer", fontWeight: 600 }}
                    onClick={() => { navigate("/dashboard"); setNotifAnchor(null); }}
                  >
                    See all notifications
                  </Typography>
                </Box>
              </Popover>

              <IconButton
                color="primary"
                size="small"
                component={RouterLink}
                to="/messages"
              >
                <Badge badgeContent={unreadMessages || undefined} color="error">
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
