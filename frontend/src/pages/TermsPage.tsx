import { Box, Container, Divider, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export function TermsPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Terms and Conditions
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Effective date: June 28, 2026
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Section heading="1. Acceptance of Terms">
        By creating an account on Hiram, you agree to be bound by these Terms and Conditions. If
        you do not agree, do not use the platform.
      </Section>

      <Section heading="2. What Hiram Does">
        Hiram is a peer-to-peer item rental marketplace that lets people in the Philippines list
        items for short-term rent and borrow items from others nearby. Hiram facilitates
        connections between listers and borrowers; it is not a party to any rental agreement and
        does not own, inspect, or guarantee any listed item.
      </Section>

      <Section heading="3. Eligibility">
        You must be at least 18 years old and legally capable of entering into contracts under
        Philippine law to use Hiram. By registering, you represent that you meet these
        requirements.
      </Section>

      <Section heading="4. User Accounts">
        <Bullet>You are responsible for keeping your login credentials confidential.</Bullet>
        <Bullet>
          You must provide accurate information at registration and keep your profile up to date.
        </Bullet>
        <Bullet>
          You may not create multiple accounts or transfer your account to another person.
        </Bullet>
        <Bullet>
          Hiram reserves the right to suspend or disable accounts that violate these terms.
        </Bullet>
      </Section>

      <Section heading="5. Listings and Rentals">
        <Bullet>
          Listers are solely responsible for the accuracy, safety, and legality of their listings.
        </Bullet>
        <Bullet>
          Borrowers must use rented items only for their stated purpose and return them in the
          same condition.
        </Bullet>
        <Bullet>
          Any rental agreement (price, duration, handover location) is between the lister and the
          borrower. Hiram provides the platform only.
        </Bullet>
        <Bullet>
          Items that are illegal, dangerous, or restricted under Philippine law may not be listed.
          Such listings will be removed and the listing account may be disabled.
        </Bullet>
      </Section>

      <Section heading="6. Identity Verification">
        Hiram offers optional identity verification. Verified users have submitted a valid
        government-issued ID reviewed by our team. Verification does not constitute a guarantee of
        trustworthiness. Hiram is not liable for actions taken by verified or unverified users.
      </Section>

      <Section heading="7. Prohibited Conduct">
        You agree not to:
        <Bullet>Use the platform for illegal activity.</Bullet>
        <Bullet>Post false, misleading, or fraudulent listings.</Bullet>
        <Bullet>Harass, threaten, or harm other users.</Bullet>
        <Bullet>Attempt to circumvent the platform by transacting outside Hiram to avoid fees.</Bullet>
        <Bullet>Upload malicious content or attempt to breach platform security.</Bullet>
      </Section>

      <Section heading="8. Content and Intellectual Property">
        You retain ownership of content you upload (photos, descriptions). By uploading content
        you grant Hiram a non-exclusive, worldwide license to display it on the platform. You
        warrant that you have the right to upload such content and that it does not infringe any
        third-party rights.
      </Section>

      <Section heading="9. Limitation of Liability">
        To the fullest extent permitted by Philippine law, Hiram and its operators are not liable
        for any loss, damage, injury, or dispute arising from rentals facilitated through the
        platform. Use Hiram at your own risk.
      </Section>

      <Section heading="10. Privacy">
        Your personal data is handled in accordance with our Privacy Policy. By using Hiram you
        consent to the collection and use of your data as described therein.
      </Section>

      <Section heading="11. Changes to Terms">
        Hiram may update these Terms at any time. Continued use of the platform after an update
        constitutes acceptance of the revised Terms.
      </Section>

      <Section heading="12. Governing Law">
        These Terms are governed by the laws of the Republic of the Philippines. Any disputes
        shall be resolved in the courts of competent jurisdiction in the Philippines.
      </Section>

      <Section heading="13. Contact">
        Questions about these Terms? Email us at{" "}
        <Link href="mailto:support@hiram.ph">support@hiram.ph</Link>.
      </Section>

      <Box sx={{ mt: 4 }}>
        <Link component={RouterLink} to="/" underline="hover" color="primary">
          ← Back to Hiram
        </Link>
      </Box>
    </Container>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 3.5 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {heading}
      </Typography>
      <Typography variant="body2" component="div" sx={{ color: "text.secondary", lineHeight: 1.8 }}>
        {children}
      </Typography>
    </Box>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <Box component="li" sx={{ ml: 2, mt: 0.5 }}>
      {children}
    </Box>
  );
}
