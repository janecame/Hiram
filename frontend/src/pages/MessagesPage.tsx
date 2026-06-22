import {
  Avatar,
  Badge,
  Box,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useConversations, useMessages, useSendMessage } from "../hooks/useMessages";
import { useSocket } from "../hooks/useSocket";
import type { Conversation } from "../types/message";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ConversationList({
  conversations,
  selected,
  onSelect,
  currentUserId,
}: {
  conversations: Conversation[];
  selected: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
}) {
  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No conversations yet
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {conversations.map((c, i) => {
        const otherName = c.borrowerId === currentUserId ? c.listerName : c.borrowerName;
        return (
          <Box key={c.id}>
            <ListItemButton
              selected={selected === c.id}
              onClick={() => onSelect(c.id)}
              sx={{ px: 2, py: 1.5 }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={c.unreadCount || undefined}
                  color="error"
                  overlap="circular"
                >
                  <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40, fontSize: 16 }}>
                    {otherName[0]?.toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" fontWeight={c.unreadCount ? 700 : 500} noWrap>
                      {otherName}
                    </Typography>
                    {c.lastMessageAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                        {timeAgo(c.lastMessageAt)}
                      </Typography>
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {c.itemTitle}
                    {c.lastMessage ? ` · ${c.lastMessage}` : ""}
                  </Typography>
                }
                sx={{ m: 0, minWidth: 0 }}
              />
            </ListItemButton>
            {i < conversations.length - 1 && <Divider />}
          </Box>
        );
      })}
    </List>
  );
}

function MessageThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    sendMessage.mutate(content);
  };

  if (isLoading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
            No messages yet. Say hello!
          </Typography>
        )}
        {messages.map((m) => {
          const isOwn = m.senderId === currentUserId;
          return (
            <Box
              key={m.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: isOwn ? "flex-end" : "flex-start",
              }}
            >
              <Box
                sx={{
                  maxWidth: "70%",
                  bgcolor: isOwn ? "primary.main" : "grey.100",
                  color: isOwn ? "primary.contrastText" : "text.primary",
                  px: 1.5,
                  py: 1,
                  borderRadius: isOwn ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                }}
              >
                <Typography variant="body2">{m.content}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3 }}>
                {timeAgo(m.createdAt)}
              </Typography>
            </Box>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      <Divider />
      <Box sx={{ p: 1.5, display: "flex", gap: 1, alignItems: "flex-end" }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <IconButton
          color="secondary"
          onClick={handleSend}
          disabled={!draft.trim() || sendMessage.isPending}
        >
          <Send size={20} />
        </IconButton>
      </Box>
    </Box>
  );
}

export function MessagesPage() {
  const { currentUser, isAuthenticated, login } = useAuth();
  const { data: conversations = [], isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useSocket();

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Sign in to view your messages
        </Typography>
        <Typography
          variant="body2"
          color="secondary"
          sx={{ cursor: "pointer", fontWeight: 600 }}
          onClick={login}
        >
          Log in
        </Typography>
      </Container>
    );
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <Container maxWidth="lg" sx={{ py: 3, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h5" fontWeight={700} color="primary" sx={{ mb: 2 }}>
        Messages
      </Typography>
      <Box
        sx={{
          display: "flex",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          height: "calc(100dvh - 220px)",
          minHeight: 400,
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: selectedId ? 0 : "100%", md: 300 },
            borderRight: "1px solid",
            borderColor: "divider",
            overflowY: "auto",
            flexShrink: 0,
            display: { xs: selectedId ? "none" : "block", md: "block" },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary">
              Conversations
            </Typography>
          </Box>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <ConversationList
              conversations={conversations}
              selected={selectedId}
              onSelect={setSelectedId}
              currentUserId={currentUser!.id}
            />
          )}
        </Box>

        {/* Thread */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {selectedConversation ? (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{ display: { xs: "block", md: "none" }, cursor: "pointer", mr: 0.5 }}
                  onClick={() => setSelectedId(null)}
                >
                  <Typography variant="caption" color="secondary" fontWeight={600}>
                    ← Back
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {selectedConversation.borrowerId === currentUser!.id
                      ? selectedConversation.listerName
                      : selectedConversation.borrowerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    re: {selectedConversation.itemTitle}
                  </Typography>
                </Box>
              </Box>
              <MessageThread
                conversationId={selectedConversation.id}
                currentUserId={currentUser!.id}
              />
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}
