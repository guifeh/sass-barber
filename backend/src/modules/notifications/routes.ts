import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { sendMail, getMailer, getResend } from './mailer';
import { env } from '../../config/env';

export async function notificationRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.get('/notifications/status', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            brevoConfigured: { type: 'boolean' },
            resendConfigured: { type: 'boolean' },
            smtpConfigured: { type: 'boolean' },
            smtpFrom: { type: 'string' },
            brevoKeyPrefix: { type: 'string' },
            resendKeyPrefix: { type: 'string' },
          },
        },
      },
    },
    handler: async () => {
      return {
        brevoConfigured: Boolean(env.BREVO_API_KEY),
        resendConfigured: Boolean(env.RESEND_API_KEY),
        smtpConfigured: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
        smtpFrom: env.SMTP_FROM ?? '',
        brevoKeyPrefix: env.BREVO_API_KEY?.substring(0, 10) ?? '',
        resendKeyPrefix: env.RESEND_API_KEY?.substring(0, 10) ?? '',
      };
    },
  });

  app.post<{ Body: { to: string } }>('/notifications/test', {
    schema: {
      body: {
        type: 'object',
        properties: {
          to: { type: 'string', format: 'email' },
        },
        required: ['to'],
      },
    },
    handler: async (request, reply) => {
      const { to } = request.body;

      console.log('[notifications] Test email requested to:', to);

      const result = await sendMail({
        to,
        subject: 'Test Email - Sass Barber',
        text: 'This is a test email from Sass Barber API. If you received this, the email service is working!',
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
            <h1 style="color: #333;">Test Email - Sass Barber</h1>
            <p>This is a test email from Sass Barber API.</p>
            <p style="color: #666;">If you received this, the email service is working!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      if (result.success) {
        return reply.status(200).send({ message: 'Test email sent successfully!', result });
      } else {
        return reply.status(500).send({ message: 'Failed to send test email', error: result.error });
      }
    },
  });
}
