import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MessageCircle, Minus, Send, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useMessages, useSendMessage } from "../hooks/useMessages";
import { createConversation } from "../api/messages";

interface ChatPopupProps {
  owner: string;
  listerId: string;
  itemId?: string | null;
  open: boolean;
  onClose: () => void;
}

export function ChatPopup({ owner, listerId, itemId = null, open, onClose }: ChatPopupProps) {
  const { isAuthenticated, currentUser, login } = useAuth();
  const [draft, setDraft] = useState("");
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ["conversation", listerId, itemId ?? "dm"],
    queryFn: () => createConversation(listerId, itemId),
    enabled: isAuthenticated && open,
  });

  const conversationId = conversation?.id;
  const { data: messages = [], isLoading: messagesLoading } = useMessages(conversationId);
  const sendMutation = useSendMessage(conversationId ?? "");

  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, minimized]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !conversationId || sendMutation.isPending) return;
    sendMutation.mutate(content, { onSuccess: () => setDraft("") });
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 320,
        zIndex: 1300,
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          cursor: "pointer",
        }}
        onClick={() => setMinimized((m) => !m)}
      >
        <MessageCircle size={16} />
        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
          {owner}
        </Typography>
        <IconButton
          size="small"
          sx={{ color: "primary.contrastText", p: 0.25 }}
          onClick={(e) => {
            e.stopPropagation();
            setMinimized((m) => !m);
          }}
        >
          <Minus size={16} />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: "primary.contrastText", p: 0.25 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X size={16} />
        </IconButton>
      </Stack>

      {/* Body */}
      <Collapse in={!minimized}>
        <Box
          sx={{
            p: 1.5,
            minHeight: 200,
            maxHeight: 280,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          {!isAuthenticated ? (
            <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ flex: 1, py: 3, color: "text.secondary" }}>
              <Typography variant="body2" textAlign="center">
                Sign in to message {owner}.
              </Typography>
              <Button size="small" variant="outlined" onClick={login}>
                Sign in
              </Button>
            </Stack>
          ) : messagesLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 3 }}>
              <CircularProgress size={24} color="primary" />
            </Stack>
          ) : messages.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 3, color: "text.secondary" }}>
              <Typography variant="body2" textAlign="center">
                Start a conversation to coordinate pickup and ask questions.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1}>
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      bgcolor: isMe ? "primary.main" : "action.hover",
                      color: isMe ? "primary.contrastText" : "text.primary",
                      borderRadius: 2,
                      px: 1.5,
                      py: 0.75,
                      maxWidth: "80%",
                    }}
                  >
                    <Typography variant="body2">{msg.content}</Typography>
                  </Box>
                );
              })}
              <div ref={bottomRef} />
            </Stack>
          )}
        </Box>

        {/* Input */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 1.5, py: 1, borderTop: "1px solid", borderColor: "divider" }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={isAuthenticated ? `Write to ${owner}…` : "Sign in to chat"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!isAuthenticated || !conversationId}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
          />
          <IconButton
            color="primary"
            disabled={!isAuthenticated || !draft.trim() || sendMutation.isPending}
            onClick={handleSend}
            size="small"
          >
            <Send size={18} />
          </IconButton>
        </Stack>
      </Collapse>
    </Box>
  );
}
