import { useState } from "react";
import { Box, Button, Container, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { apiLogin } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      const resp = await apiLogin({ email, password });
      setSession(resp.user);
      navigate("/");
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
          Log in to Hiram
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Borrow what's near.
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            disabled={busy || !email || !password}
            onClick={() => void handleSubmit()}
          >
            {busy ? "…" : "Log in"}
          </Button>
        </Stack>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Don't have an account?{" "}
            <Link component={RouterLink} to="/signup" underline="hover" color="secondary" fontWeight={600}>
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
