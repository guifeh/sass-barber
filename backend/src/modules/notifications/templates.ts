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
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function baseEmailLayout(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f1115;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0f1115;
      padding-bottom: 40px;
    }
    .main {
      background-color: #1a1d23;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 40px;
      border: 1px solid #2d3139;
    }
    .header {
      background: linear-gradient(135deg, #b38a38 0%, #ffdf91 50%, #b38a38 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #1a1d23;
      font-size: 24px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      margin-top: 0;
      color: #ffffff;
      font-size: 22px;
    }
    .content p {
      line-height: 1.6;
      color: #94a3b8;
      font-size: 16px;
    }
    .info-table {
      width: 100%;
      background-color: #242830;
      border-radius: 12px;
      margin: 24px 0;
      border-collapse: separate;
      border-spacing: 0;
    }
    .info-table td {
      padding: 16px;
      border-bottom: 1px solid #2d3139;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .label {
      color: #64748b;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      width: 120px;
    }
    .value {
      color: #f1f5f9;
      font-weight: 500;
      font-size: 15px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 13px;
      color: #475569;
    }
    .button-container {
      margin-top: 32px;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      font-size: 15px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #b38a38 0%, #ffdf91 100%);
      color: #1a1d23 !important;
    }
    .btn-secondary {
      background-color: #2d3139;
      color: #cbd5e1 !important;
      margin-left: 10px;
    }
    @media screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
      .main { border-radius: 0; margin-top: 0; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main">
      <tr>
        <td class="header">
          <h1>Sass Barber</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; ${new Date().getFullYear()} Sass Barber. Todos os direitos reservados.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function appointmentCreatedForUser(data: AppointmentEmailData): { subject: string; text: string; html: string } {
  const base = data.appBaseUrl?.replace(/\/$/, '') ?? '';
  const confirmUrl = data.confirmationToken && base
    ? `${base}/appointments/confirm?token=${encodeURIComponent(data.confirmationToken)}`
    : '';
  const cancelUrl = data.confirmationToken && base
    ? `${base}/appointments/cancel?token=${encodeURIComponent(data.confirmationToken)}`
    : '';

  const subject = `Agendamento Registrado – ${data.serviceName}`;
  const text = `Olá ${data.userName},\n\nSeu agendamento foi registrado com sucesso.\n\nServiço: ${data.serviceName}\nBarbeiro: ${data.barberName}\nData: ${formatDateTime(data.startTime)}\n\nConfirme agora: ${confirmUrl}\nCancelar: ${cancelUrl}`;

  const content = `
    <h2>Seu horário está reservado!</h2>
    <p>Olá, <strong>${escapeHtml(data.userName)}</strong>. Recebemos seu pedido de agendamento e estamos ansiosos para atender você.</p>
    
    <table class="info-table">
      <tr><td class="label">Serviço</td><td class="value">${escapeHtml(data.serviceName)}</td></tr>
      <tr><td class="label">Barbeiro</td><td class="value">${escapeHtml(data.barberName)}</td></tr>
      <tr><td class="label">Data/Hora</td><td class="value">${escapeHtml(formatDateTime(data.startTime))}</td></tr>
    </table>

    <p>Para garantir sua vaga, por favor confirme seu agendamento abaixo:</p>
    
    <div class="button-container">
      ${confirmUrl ? `<a href="${confirmUrl}" class="btn btn-primary">CONFIRMAR AGENDAMENTO</a>` : ''}
      ${cancelUrl ? `<a href="${cancelUrl}" class="btn btn-secondary">CANCELAR</a>` : ''}
    </div>
  `;

  return { subject, text, html: baseEmailLayout(content, 'Agendamento Registrado') };
}

export function appointmentCreatedForBarber(data: AppointmentEmailData): { subject: string; text: string; html: string } {
  const subject = `Novo Agendamento – ${data.userName}`;
  const text = `Olá ${data.barberName},\n\nUm novo agendamento foi registrado.\n\nCliente: ${data.userName}\nServiço: ${data.serviceName}\nData: ${formatDateTime(data.startTime)}`;

  const content = `
    <h2>Novo serviço agendado</h2>
    <p>Olá, <strong>${escapeHtml(data.barberName)}</strong>. Um novo cliente acabou de agendar um horário com você.</p>
    
    <table class="info-table">
      <tr><td class="label">Cliente</td><td class="value">${escapeHtml(data.userName)}</td></tr>
      <tr><td class="label">E-mail</td><td class="value">${escapeHtml(data.userEmail)}</td></tr>
      <tr><td class="label">Serviço</td><td class="value">${escapeHtml(data.serviceName)}</td></tr>
      <tr><td class="label">Data/Hora</td><td class="value">${escapeHtml(formatDateTime(data.startTime))}</td></tr>
    </table>

    <p>Prepare tudo para receber seu cliente com excelência!</p>
  `;

  return { subject, text, html: baseEmailLayout(content, 'Novo Agendamento') };
}

export function confirmationReminder(data: AppointmentEmailData): { subject: string; text: string; html: string } {
  const base = data.appBaseUrl?.replace(/\/$/, '') ?? '';
  const confirmUrl = data.confirmationToken && base
    ? `${base}/appointments/confirm?token=${encodeURIComponent(data.confirmationToken)}`
    : '';
  const cancelUrl = data.confirmationToken && base
    ? `${base}/appointments/cancel?token=${encodeURIComponent(data.confirmationToken)}`
    : '';

  const subject = `Lembrete: Confirme seu agendamento – ${data.serviceName}`;
  const text = `Olá ${data.userName},\n\nLembrete de agendamento pendente.\n\nServiço: ${data.serviceName}\nBarbeiro: ${data.barberName}\nData: ${formatDateTime(data.startTime)}\n\nConfirmar: ${confirmUrl}\nCancelar: ${cancelUrl}`;

  const content = `
    <h2>Não esqueça de confirmar!</h2>
    <p>Olá, <strong>${escapeHtml(data.userName)}</strong>. Notamos que você ainda não confirmou seu agendamento para breve.</p>
    
    <table class="info-table">
      <tr><td class="label">Serviço</td><td class="value">${escapeHtml(data.serviceName)}</td></tr>
      <tr><td class="label">Barbeiro</td><td class="value">${escapeHtml(data.barberName)}</td></tr>
      <tr><td class="label">Data/Hora</td><td class="value">${escapeHtml(formatDateTime(data.startTime))}</td></tr>
    </table>

    <p>Clique no botão abaixo para confirmar sua presença:</p>
    
    <div class="button-container">
      ${confirmUrl ? `<a href="${confirmUrl}" class="btn btn-primary">CONFIRMAR PRESENÇA</a>` : ''}
      ${cancelUrl ? `<a href="${cancelUrl}" class="btn btn-secondary">CANCELAR</a>` : ''}
    </div>
  `;

  return { subject, text, html: baseEmailLayout(content, 'Lembrete de Agendamento') };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
