import { useState } from "react";
import { Box, Button, Container, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { apiForgotPassword } from "../api/auth";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      await apiForgotPassword(email);
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Forgot your password?
        </Typography>

        {sent ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            If that email is registered, we've sent a link to reset your password.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Enter your email and we'll send you a link to reset it.
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { void handleSubmit(); } }}
                autoFocus
              />

              {error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}

              <Button
                variant="contained"
                color="secondary"
                size="large"
                disabled={busy || !email}
                onClick={() => void handleSubmit()}
              >
                {busy ? "…" : "Send reset link"}
              </Button>
            </Stack>
          </>
        )}

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            <Link component={RouterLink} to="/login" underline="hover" color="secondary" fontWeight={600}>
              Back to log in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
