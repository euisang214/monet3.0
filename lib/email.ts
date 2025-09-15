import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

/**
 * Sends an email using the configured SMTP transport. Errors are logged but
 * execution continues so that failures to send mail don't halt the caller.
 */
export async function sendEmail(options: Mail.Options) {
  if (!process.env.SMTP_HOST) return;
  try {
    await mailer.sendMail(options);
  } catch (err) {
    console.error('Failed to send email', err);
    // Swallow the error to avoid interrupting caller execution
  }
}
