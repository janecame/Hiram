import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MessageCircle, Send } from "lucide-react";

interface ChatPanelProps {
  /** Display name of the lister the borrower would chat with. */
  owner: string;
}

/**
 * Phase 1 UI-ONLY chat panel — purely presentational.
 * No messages are sent or stored; real-time messaging is a Phase 2 task.
 */
export function ChatPanel({ owner }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

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
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Stack spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
          <Typography variant="body2" textAlign="center">
            Start a conversation to coordinate pickup and ask questions.
          </Typography>
          <Typography variant="caption" textAlign="center">
            (Chat is a preview in Phase 1 — messages are not delivered.)
          </Typography>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder={`Write to ${owner}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled
        />
        <Button
          variant="outlined"
          color="primary"
          endIcon={<Send size={16} />}
          disabled
        >
          Send
        </Button>
      </Stack>
    </Stack>
  );
}
