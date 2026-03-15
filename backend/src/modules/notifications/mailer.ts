import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../../config/env';

let transporter: nodemailer.Transporter | null = null;
let resendClient: Resend | null = null;

function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export function getResend(): Resend | null {
  if (resendClient) return resendClient;
  if (!isResendConfigured()) return null;
  resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

export function getMailer(): nodemailer.Transporter | null {
  if (transporter !== null) {
    return transporter;
  }
  if (!isSmtpConfigured()) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Try Resend first (Option B - Production recommended)
  const resend = getResend();
  if (resend) {
    try {
      const from = env.SMTP_FROM ?? 'onboarding@resend.dev';
      const { error } = await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Resend error: ${message}` };
    }
  }

  // Fallback to Nodemailer (Option A / Development)
  const mail = getMailer();
  if (!mail) {
    return { success: false, error: 'No email service configured (Resend or SMTP)' };
  }
  const from = env.SMTP_FROM ?? env.SMTP_USER ?? 'noreply@barbearia.local';
  try {
    await mail.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `SMTP error: ${message}` };
  }
}
