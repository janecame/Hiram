import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useMessages, useSendMessage } from "../hooks/useMessages";
import { createConversation } from "../api/messages";

interface ChatPanelProps {
  owner: string;
  itemId: string;
  listerId: string;
}

export function ChatPanel({ owner, itemId, listerId }: ChatPanelProps) {
  const { isAuthenticated, currentUser, login } = useAuth();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Idempotent find-or-create: safe to call on every render when authenticated
  const { data: conversation } = useQuery({
    queryKey: ["conversation", itemId, listerId],
    queryFn: () => createConversation(itemId, listerId),
    enabled: isAuthenticated,
  });

  const conversationId = conversation?.id;
  const { data: messages = [], isLoading: messagesLoading } = useMessages(conversationId);
  const sendMutation = useSendMessage(conversationId ?? "");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !conversationId || sendMutation.isPending) return;
    sendMutation.mutate(content, { onSuccess: () => setDraft("") });
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <MessageCircle size={18} />
        <Typography variant="h6" component="h2">
          Message {owner}
        </Typography>
      </Stack>

      <Box
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 2,
          minHeight: 120,
          maxHeight: 280,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!isAuthenticated ? (
          <Stack
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ flex: 1, color: "text.secondary" }}
          >
            <Typography variant="body2" textAlign="center">
              Sign in to message {owner}.
            </Typography>
            <Button size="small" variant="outlined" onClick={login}>
              Sign in
            </Button>
          </Stack>
        ) : messagesLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
            <CircularProgress size={24} color="primary" />
          </Stack>
        ) : messages.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ flex: 1, color: "text.secondary" }}
          >
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

      <Stack direction="row" spacing={1}>
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
        />
        <Button
          variant="outlined"
          color="primary"
          endIcon={<Send size={16} />}
          disabled={!isAuthenticated || !draft.trim() || sendMutation.isPending}
          onClick={handleSend}
        >
          Send
        </Button>
      </Stack>
    </Stack>
  );
}
