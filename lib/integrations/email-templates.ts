/**
 * Email template utilities for consistent branding across all transactional emails.
 * Uses the platform's design tokens for visual consistency.
 */

// Brand colors from styles/tokens.css
const COLORS = {
  accent: '#2563eb',
  accentStrong: '#1d4ed8',
  text: '#0f172a',
  textMuted: '#475569',
  muted: '#f1f5f9',
  success: '#16a34a',
  danger: '#dc2626',
  border: '#e2e8f0',
  white: '#ffffff',
} as const;

interface EmailTemplateOptions {
  title: string;
  preheader?: string;
  greeting?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}

/**
 * Wraps email content in a consistent branded template.
 */
export function createEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    preheader = '',
    greeting = '',
    body,
    ctaText,
    ctaUrl,
    footer = 'If you have any questions, please contact our support team.',
  } = options;

  const ctaButton = ctaText && ctaUrl
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <tr>
          <td style="border-radius: 6px; background: ${COLORS.accent};">
            <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 600; color: ${COLORS.white}; text-decoration: none; border-radius: 6px;">
              ${ctaText}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${COLORS.accent}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}

  <!-- Main container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 560px; background-color: ${COLORS.white}; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid ${COLORS.border};">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${COLORS.text};">
                Monet
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${greeting ? `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: ${COLORS.text};">${greeting}</p>` : ''}

              <div style="font-size: 16px; line-height: 1.6; color: ${COLORS.text};">
                ${body}
              </div>

              ${ctaButton}

              ${ctaUrl ? `
                <p style="margin: 16px 0 0 0; font-size: 13px; line-height: 1.5; color: ${COLORS.textMuted};">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${ctaUrl}" style="color: ${COLORS.accent}; word-break: break-all;">${ctaUrl}</a>
                </p>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid ${COLORS.border}; background-color: ${COLORS.muted}; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: ${COLORS.textMuted}; text-align: center;">
                ${footer}
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; line-height: 1.5; color: ${COLORS.textMuted}; text-align: center;">
                &copy; ${new Date().getFullYear()} Monet. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Creates a plain text fallback from HTML content.
 */
export function createPlainTextFallback(options: EmailTemplateOptions): string {
  const {
    greeting = '',
    body,
    ctaText,
    ctaUrl,
    footer = 'If you have any questions, please contact our support team.',
  } = options;

  // Strip HTML tags for plain text
  const plainBody = body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  let text = '';

  if (greeting) {
    text += greeting + '\n\n';
  }

  text += plainBody;

  if (ctaText && ctaUrl) {
    text += `\n\n${ctaText}: ${ctaUrl}`;
  }

  text += `\n\n---\n${footer}\n\n(c) ${new Date().getFullYear()} Monet. All rights reserved.`;

  return text;
}

/**
 * Creates an info box for highlighting important information.
 */
export function createInfoBox(content: string): string {
  return `
    <div style="background: ${COLORS.muted}; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${COLORS.accent};">
      ${content}
    </div>
  `;
}

/**
 * Creates a warning box for cautionary information.
 */
export function createWarningBox(content: string): string {
  return `
    <div style="background: #fef3c7; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      ${content}
    </div>
  `;
}

/**
 * Creates a success box for positive information.
 */
export function createSuccessBox(content: string): string {
  return `
    <div style="background: #dcfce7; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${COLORS.success};">
      ${content}
    </div>
  `;
}

/**
 * Default from address for emails.
 */
export function getDefaultFromAddress(): string {
  return process.env.SMTP_FROM || 'Monet <noreply@monet.com>';
}

/**
 * Get the app URL for email links.
 */
export function getAppUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}
