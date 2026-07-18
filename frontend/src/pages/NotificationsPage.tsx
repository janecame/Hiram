import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { ArrowLeft, Bell } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useMarkAllRead, useMarkRead, useNotifications } from "../hooks/useNotifications";

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

export function NotificationsPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { data: notifications = [], isLoading } = useNotifications({ limit: 100 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/" replace />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (id: string, requestId?: string, type?: string) => {
    markRead.mutate(id);
    if (requestId) {
      navigate("/transaction");
    } else if (type === "id_verified" || type === "id_rejected") {
      navigate(`/profile/${encodeURIComponent(currentUser.name)}`);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back
      </Button>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h3" component="h1">
          Notifications
        </Typography>
        {unreadCount > 0 && (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() =>
              markAllRead.mutate(undefined, {
                onSuccess: () => snackbar.success("All notifications marked as read."),
              })
            }
          >
            Mark all read
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : notifications.length === 0 ? (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            py: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            color: "text.secondary",
          }}
        >
          <Bell size={32} />
          <Typography variant="body2">No notifications yet</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <List disablePadding>
            {notifications.map((n, i) => (
              <Box key={n.id}>
                <ListItem
                  alignItems="flex-start"
                  onClick={() => handleClick(n.id, n.requestId, n.type)}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: !n.read ? "rgba(28,74,58,0.05)" : "transparent",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  {!n.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "error.main",
                        mt: 0.8,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
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
            ))}
          </List>
        </Box>
      )}
    </Container>
  );
}
