import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAcceptTerms, useCurrentUser } from "../hooks/useUser";

const TERMS_ACCEPTED_KEY = "hiram_terms_accepted";

/**
 * Site-wide Terms and Conditions gate.
 *
 * - Visitors (not logged in) see the popup once per browser; acceptance is remembered
 *   in localStorage so it does not reappear on every page load.
 * - Logged-in users who have already accepted (recorded as `terms_accepted_at` in the DB)
 *   never see it again, even on a fresh browser.
 */
export function TermsGate() {
  const { isAuthenticated } = useAuth();
  const [browserAccepted, setBrowserAccepted] = useState(
    () => localStorage.getItem(TERMS_ACCEPTED_KEY) === "1"
  );
  const acceptMutation = useAcceptTerms();

  // Only hit the server when logged in and this browser hasn't already recorded acceptance.
  const { data: me, isLoading } = useCurrentUser(isAuthenticated && !browserAccepted);

  // A logged-in user who accepted before (possibly on another device) — sync the browser
  // flag so the popup stays hidden and we stop re-fetching.
  useEffect(() => {
    if (me?.termsAcceptedAt) {
      localStorage.setItem(TERMS_ACCEPTED_KEY, "1");
      setBrowserAccepted(true);
    }
  }, [me?.termsAcceptedAt]);

  if (browserAccepted) return null;
  // While checking the logged-in user's server record, hold off to avoid a flash.
  if (isAuthenticated && isLoading) return null;

  const handleAccept = () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, "1");
    setBrowserAccepted(true);
    if (isAuthenticated) acceptMutation.mutate();
  };

  return (
    <Dialog open maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ pb: 0 }}>Welcome to Hiram</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Before you browse and borrow, please review and accept our Terms and Conditions.
          </Typography>

          <Divider />

          <Box sx={{ maxHeight: 240, overflowY: "auto", pr: 1 }}>
            <Stack spacing={1.5}>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                Hiram is a peer-to-peer rental marketplace that connects people in the Philippines
                who want to lend and borrow items. Hiram only provides the platform — every rental
                agreement is between the lister and the borrower.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                By continuing, you agree to use Hiram lawfully and respectfully: provide accurate
                information, only list items you are allowed to rent out, return borrowed items in
                the same condition, and treat other users fairly. Hiram is not liable for losses or
                disputes arising from rentals arranged through the platform.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                This is a short summary. Read the{" "}
                <Link
                  component={RouterLink}
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="primary"
                >
                  full Terms and Conditions
                </Link>{" "}
                for the complete details.
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          fullWidth
          onClick={handleAccept}
        >
          I Accept the Terms and Conditions
        </Button>
      </DialogActions>
    </Dialog>
  );
}
