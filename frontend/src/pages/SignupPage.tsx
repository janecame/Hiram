import { useState } from "react";
import { Box, Button, Checkbox, Container, FormControlLabel, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { apiRegister } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

export function SignupPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    if (!termsAccepted) { setError("You must accept the Terms and Conditions to register."); return; }
    setBusy(true);
    try {
      const resp = await apiRegister({
        name: name.trim(),
        email,
        password,
        termsAcceptedAt: new Date().toISOString(),
      });
      setSession(resp);
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
          Create an account
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Join Hiram and start borrowing or lending nearby.
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Your name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { void handleSubmit(); } }}
          />

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{" "}
                <Link
                  component={RouterLink}
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms and Conditions
                </Link>
              </Typography>
            }
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
            disabled={busy || !email || !password || !termsAccepted}
            onClick={() => void handleSubmit()}
          >
            {busy ? "…" : "Create account"}
          </Button>
        </Stack>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Already have an account?{" "}
            <Link component={RouterLink} to="/login" underline="hover" color="secondary" fontWeight={600}>
              Log in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
