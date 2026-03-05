export interface AppointmentEmailData {
  userName: string;
  userEmail: string;
  barberName: string;
  barberEmail: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  confirmationToken: string | null;
  appBaseUrl: string;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export function appointmentCreatedForUser(data: AppointmentEmailData): { subject: string; text: string; html: string } {
  const subject = `Agendamento confirmado – ${data.serviceName}`;
  const text = [
    `Olá ${data.userName},`,
    '',
    `Seu agendamento foi registrado com sucesso.`,
    '',
    `Serviço: ${data.serviceName}`,
    `Barbeiro: ${data.barberName}`,
    `Data e horário: ${formatDateTime(data.startTime)} às ${formatDateTime(data.endTime).split(' ').pop() ?? ''}`,
    '',
    'Em breve você receberá um e-mail com o link para confirmar ou cancelar o agendamento.',
    '',
    'Até lá!',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Agendamento</title></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Agendamento registrado</h2>
  <p>Olá ${escapeHtml(data.userName)},</p>
  <p>Seu agendamento foi registrado com sucesso.</p>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Serviço</td><td>${escapeHtml(data.serviceName)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Barbeiro</td><td>${escapeHtml(data.barberName)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Data e horário</td><td>${escapeHtml(formatDateTime(data.startTime))}</td></tr>
  </table>
  <p style="color: #666;">Em breve você receberá um e-mail com o link para confirmar ou cancelar o agendamento.</p>
  <p>Até lá!</p>
</body>
</html>`;

  return { subject, text, html };
}

export function appointmentCreatedForBarber(data: AppointmentEmailData): { subject: string; text: string; html: string } {
  const subject = `Novo agendamento – ${data.serviceName} – ${data.userName}`;
  const text = [
    `Olá ${data.barberName},`,
    '',
    'Um novo agendamento foi registrado.',
    '',
    `Cliente: ${data.userName} (${data.userEmail})`,
    `Serviço: ${data.serviceName}`,
    `Data e horário: ${formatDateTime(data.startTime)}`,
    '',
    'Até lá!',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Novo agendamento</title></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Novo agendamento</h2>
  <p>Olá ${escapeHtml(data.barberName)},</p>
  <p>Um novo agendamento foi registrado.</p>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Cliente</td><td>${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Serviço</td><td>${escapeHtml(data.serviceName)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Data e horário</td><td>${escapeHtml(formatDateTime(data.startTime))}</td></tr>
  </table>
  <p>Até lá!</p>
</body>
</html>`;

  return { subject, text, html };
}

export function confirmationReminder(data: AppointmentEmailData): { subject: string; text: string; html: string } {
  const base = data.appBaseUrl?.replace(/\/$/, '') ?? '';
  const confirmUrl =
    data.confirmationToken && base
      ? `${base}/appointments/confirm?token=${encodeURIComponent(data.confirmationToken)}`
      : '';
  const cancelUrl =
    data.confirmationToken && base
      ? `${base}/appointments/cancel?token=${encodeURIComponent(data.confirmationToken)}`
      : '';
  const subject = `Confirme seu agendamento – ${data.serviceName}`;
  const text = [
    `Olá ${data.userName},`,
    '',
    'Lembrete: você tem um agendamento pendente de confirmação.',
    '',
    `Serviço: ${data.serviceName}`,
    `Barbeiro: ${data.barberName}`,
    `Data e horário: ${formatDateTime(data.startTime)}`,
    '',
    confirmUrl ? `Confirmar: ${confirmUrl}` : '',
    cancelUrl ? `Cancelar: ${cancelUrl}` : '',
    '',
    'Até lá!',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Confirme seu agendamento</title></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Confirme seu agendamento</h2>
  <p>Olá ${escapeHtml(data.userName)},</p>
  <p>Lembrete: você tem um agendamento pendente de confirmação.</p>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Serviço</td><td>${escapeHtml(data.serviceName)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Barbeiro</td><td>${escapeHtml(data.barberName)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #666;">Data e horário</td><td>${escapeHtml(formatDateTime(data.startTime))}</td></tr>
  </table>
  ${confirmUrl ? `<p><a href="${escapeHtml(confirmUrl)}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; margin-right: 8px;">Confirmar agendamento</a></p>` : ''}
  ${cancelUrl ? `<p><a href="${escapeHtml(cancelUrl)}" style="display: inline-block; padding: 10px 20px; background: #6b7280; color: #fff; text-decoration: none; border-radius: 6px;">Cancelar agendamento</a></p>` : ''}
  <p>Até lá!</p>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
