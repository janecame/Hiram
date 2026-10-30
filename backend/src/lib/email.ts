import "dotenv/config";
import { Resend } from "resend";

const resendApiKey = process.env["RESEND_API_KEY"];
const emailFrom = process.env["EMAIL_FROM"] ?? "Hiram <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping password reset email to ${to}. Reset URL: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject: "Reset your Hiram password",
    html: `
      <p>Someone requested a password reset for this Hiram account.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    console.error(`Failed to send password reset email to ${to}: ${error.name} - ${error.message}`);
  }
}
