import nodemailer from 'nodemailer';
import { env } from '../../config/env';

let transporter: nodemailer.Transporter | null = null;

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
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
  });
  return transporter;
}

export async function sendMail(options: {
  to: string | 'testeslamano@gmail.com';
  subject: string;
  text: string;
  html?: string;
}): Promise<{ success: boolean; error?: string }> {
  const mail = getMailer();
  if (!mail) {
    return { success: false, error: 'SMTP not configured' };
  }
  const from = env.SMTP_FROM ?? env.SMTP_USER ?? 'noreply@barbearia.local';
  try {
    await mail.sendMail({
      from,
      to: options.to ?? 'testeslamano@gmail.com',
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
