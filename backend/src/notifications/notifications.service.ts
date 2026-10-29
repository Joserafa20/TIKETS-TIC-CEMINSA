import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface TicketEmailData {
  ticketId: string;
  titulo: string;
  categoria: string;
  prioridad: string;
  estado?: string;
  solicitanteNombre: string;
  solicitanteEmail: string;
  tecnicoNombre?: string;
  tecnicoEmail?: string;
  comentario?: string;
  esInterno?: boolean;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get('MAIL_HOST');
    const user = this.config.get('MAIL_USER');
    const pass = this.config.get('MAIL_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('MAIL_PORT') ?? 587),
        secure: this.config.get('MAIL_SECURE') === 'true',
        auth: { user, pass },
      });
    } else {
      this.logger.warn('Email not configured — MAIL_HOST/USER/PASS missing. Skipping emails.');
    }
  }

  private async send(to: string | string[], subject: string, html: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM') ?? 'Soporte TIC CEMINSA <sistemas@ceminsa.gov.co>',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Error sending email to ${to}: ${(err as Error).message}`);
    }
  }

  private baseTemplate(title: string, body: string, ticket: TicketEmailData) {
    const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
    const ticketUrl = `${frontendUrl}/tickets/${ticket.ticketId}`;
    return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .header { background: #1e40af; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: .8; }
  .body { padding: 28px 32px; color: #1e293b; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .meta { background: #f8fafc; border-left: 4px solid #1e40af; border-radius: 4px; padding: 12px 16px; margin: 16px 0; font-size: 14px; }
  .meta p { margin: 4px 0; }
  .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #1e40af; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; }
  .footer { background: #f8fafc; padding: 16px 32px; font-size: 12px; color: #64748b; text-align: center; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>🎫 Soporte TIC — ESE CEMINSA</h1>
    <p>Sistema de Gestión de Tickets</p>
  </div>
  <div class="body">
    <h2 style="margin-top:0">${title}</h2>
    ${body}
    <div class="meta">
      <p><strong>Ticket:</strong> #${ticket.ticketId.slice(0, 8).toUpperCase()}</p>
      <p><strong>Asunto:</strong> ${escHtml(ticket.titulo)}</p>
      <p><strong>Categoría:</strong> ${escHtml(ticket.categoria)}</p>
      <p><strong>Prioridad:</strong> ${escHtml(ticket.prioridad)}</p>
      ${ticket.estado ? `<p><strong>Estado:</strong> ${escHtml(ticket.estado)}</p>` : ''}
      ${ticket.tecnicoNombre ? `<p><strong>Técnico asignado:</strong> ${escHtml(ticket.tecnicoNombre)}</p>` : ''}
    </div>
    <a href="${ticketUrl}" class="btn">Ver ticket</a>
  </div>
  <div class="footer">Este correo fue enviado automáticamente por el sistema de tickets de ESE CEMINSA. No respondas a este mensaje.</div>
</div>
</body></html>`;
  }

  async notifyTicketCreated(data: TicketEmailData, technicianEmails: string[]) {
    const body = `<p>Hola <strong>${escHtml(data.solicitanteNombre)}</strong>,</p>
    <p>Tu solicitud de soporte ha sido registrada exitosamente. Nuestro equipo TIC la revisará y te notificará cuando sea asignada.</p>`;

    await this.send(
      data.solicitanteEmail,
      `[Soporte TIC] Ticket registrado: ${data.titulo}`,
      this.baseTemplate('Tu ticket fue registrado', body, data),
    );

    if (technicianEmails.length > 0) {
      const bodyTech = `<p>Se ha creado un nuevo ticket en el sistema que requiere atención.</p>
      <p><strong>Solicitante:</strong> ${escHtml(data.solicitanteNombre)} (${escHtml(data.solicitanteEmail)})</p>`;
      await this.send(
        technicianEmails,
        `[Soporte TIC] Nuevo ticket: ${data.titulo}`,
        this.baseTemplate('Nuevo ticket creado', bodyTech, data),
      );
    }
  }

  async notifyTicketAssigned(data: TicketEmailData) {
    if (!data.tecnicoEmail) return;
    const body = `<p>Hola <strong>${escHtml(data.tecnicoNombre ?? '')}</strong>,</p>
    <p>Se te ha asignado el siguiente ticket para su atención:</p>`;
    await this.send(
      data.tecnicoEmail,
      `[Soporte TIC] Ticket asignado: ${data.titulo}`,
      this.baseTemplate('Se te asignó un ticket', body, data),
    );
  }

  async notifyNewComment(data: TicketEmailData) {
    const recipients: string[] = [];
    if (data.solicitanteEmail) recipients.push(data.solicitanteEmail);
    if (data.tecnicoEmail) recipients.push(data.tecnicoEmail);

    if (recipients.length === 0) return;

    const body = `<p>Se ha añadido un nuevo comentario al ticket.</p>
    ${data.comentario ? `<blockquote style="border-left:3px solid #1e40af;margin:12px 0;padding:8px 16px;background:#f8fafc;color:#475569">${escHtml(data.comentario)}</blockquote>` : ''}`;

    await this.send(
      recipients,
      `[Soporte TIC] Nuevo comentario: ${data.titulo}`,
      this.baseTemplate('Nuevo comentario en tu ticket', body, data),
    );
  }

  async notifyTicketResolved(data: TicketEmailData) {
    const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
    const rateUrl = `${frontendUrl}/mis-tickets/${data.ticketId}`;
    const body = `<p>Hola <strong>${escHtml(data.solicitanteNombre)}</strong>,</p>
    <p>Tu ticket ha sido marcado como <strong>Resuelto</strong>. Por favor califica la atención recibida para ayudarnos a mejorar.</p>
    <a href="${rateUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">⭐ Calificar atención</a>`;

    await this.send(
      data.solicitanteEmail,
      `[Soporte TIC] Ticket resuelto: ${data.titulo}`,
      this.baseTemplate('Tu ticket fue resuelto', body, data),
    );
  }

  async notifyTicketClosed(data: TicketEmailData) {
    const body = `<p>Hola <strong>${escHtml(data.solicitanteNombre)}</strong>,</p>
    <p>Tu ticket ha sido cerrado. Si el problema persiste, no dudes en abrir un nuevo ticket.</p>`;

    await this.send(
      data.solicitanteEmail,
      `[Soporte TIC] Ticket cerrado: ${data.titulo}`,
      this.baseTemplate('Tu ticket fue cerrado', body, data),
    );
  }
}
