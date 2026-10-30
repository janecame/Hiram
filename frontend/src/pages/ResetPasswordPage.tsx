import { useState } from "react";
import { Box, Button, Container, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { apiResetPassword } from "../api/auth";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await apiResetPassword({ token, password });
      navigate("/login");
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
          Set a new password
        </Typography>

        {!token ? (
          <Typography variant="body2" color="error">
            This reset link is missing its token. Request a new one from the{" "}
            <Link component={RouterLink} to="/forgot-password" underline="hover" color="secondary">
              forgot password
            </Link>{" "}
            page.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <TextField
              label="New password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <TextField
              label="Confirm new password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { void handleSubmit(); } }}
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
              disabled={busy || !password || !confirmPassword}
              onClick={() => void handleSubmit()}
            >
              {busy ? "…" : "Reset password"}
            </Button>
          </Stack>
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
