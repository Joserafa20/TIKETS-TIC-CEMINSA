import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

const TICKET_INCLUDE = {
  categoria: { select: { id: true, nombre: true, icono: true } },
  solicitante: { select: { id: true, nombre: true, email: true, area: true } },
  tecnico: { select: { id: true, nombre: true, email: true } },
  comentarios: {
    include: { autor: { select: { id: true, nombre: true, rol: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  adjuntos: true,
} as const;

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateTicketDto, solicitanteId: string) {
    const ticket = await this.prisma.ticket.create({
      data: { ...dto, solicitanteId },
      include: TICKET_INCLUDE,
    });

    const technicians = await this.prisma.user.findMany({
      where: { rol: { in: [Role.TECNICO, Role.ADMIN] }, activo: true },
      select: { email: true },
    });

    this.notifications.notifyTicketCreated(
      {
        ticketId: ticket.id,
        titulo: ticket.titulo,
        categoria: ticket.categoria.nombre,
        prioridad: ticket.prioridad,
        solicitanteNombre: ticket.solicitante.nombre,
        solicitanteEmail: ticket.solicitante.email,
      },
      technicians.map((t) => t.email),
    );

    return ticket;
  }

  findAll(userId: string, rol: Role) {
    const where = rol === Role.SOLICITANTE ? { solicitanteId: userId } : undefined;
    return this.prisma.ticket.findMany({
      where,
      include: TICKET_INCLUDE,
      orderBy: { fechaApertura: 'desc' },
    });
  }

  async findOne(id: string, userId: string, rol: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (rol === Role.SOLICITANTE && ticket.solicitanteId !== userId) {
      throw new ForbiddenException('No tenés acceso a este ticket');
    }
    if (rol === Role.SOLICITANTE) {
      return { ...ticket, comentarios: ticket.comentarios.filter((c) => !c.esInterno) };
    }
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, userId: string, rol: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const data: Record<string, unknown> = {};

    if (rol === Role.SOLICITANTE) {
      if (dto.calificacion !== undefined) {
        if (ticket.estado !== TicketStatus.RESUELTO) {
          throw new ForbiddenException('Solo podés calificar tickets resueltos');
        }
        data['calificacion'] = dto.calificacion;
        data['comentarioCalif'] = dto.comentarioCalif;
        data['estado'] = TicketStatus.CERRADO;
        data['fechaCierre'] = new Date();
      } else {
        throw new ForbiddenException('No tenés permisos para esta acción');
      }
    } else {
      if (dto.estado) data['estado'] = dto.estado;
      if (dto.prioridad) data['prioridad'] = dto.prioridad;
      if (dto.tecnicoId !== undefined) data['tecnicoId'] = dto.tecnicoId;
      if (dto.estado === TicketStatus.RESUELTO || dto.estado === TicketStatus.CERRADO) {
        data['fechaCierre'] = new Date();
      }
    }

    const updated = await this.prisma.ticket.update({ where: { id }, data, include: TICKET_INCLUDE });

    // Fire-and-forget notifications based on what changed
    const emailBase = {
      ticketId: updated.id,
      titulo: updated.titulo,
      categoria: updated.categoria.nombre,
      prioridad: updated.prioridad,
      estado: updated.estado,
      solicitanteNombre: updated.solicitante.nombre,
      solicitanteEmail: updated.solicitante.email,
      tecnicoNombre: updated.tecnico?.nombre,
      tecnicoEmail: updated.tecnico?.email,
    };

    if (dto.tecnicoId && dto.tecnicoId !== ticket.tecnicoId) {
      this.notifications.notifyTicketAssigned(emailBase);
    }
    if (dto.estado === TicketStatus.RESUELTO) {
      this.notifications.notifyTicketResolved(emailBase);
    }
    if (dto.estado === TicketStatus.CERRADO && rol !== Role.SOLICITANTE) {
      this.notifications.notifyTicketClosed(emailBase);
    }

    return updated;
  }

  async addComment(ticketId: string, dto: CreateCommentDto, autorId: string, rol: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    if (dto.esInterno && rol === Role.SOLICITANTE) {
      throw new ForbiddenException('No podés crear comentarios internos');
    }

    const comment = await this.prisma.comment.create({
      data: { contenido: dto.contenido, esInterno: dto.esInterno ?? false, ticketId, autorId },
      include: { autor: { select: { id: true, nombre: true, rol: true } } },
    });

    if (!dto.esInterno) {
      this.notifications.notifyNewComment({
        ticketId: ticket.id,
        titulo: ticket.titulo,
        categoria: ticket.categoria.nombre,
        prioridad: ticket.prioridad,
        solicitanteNombre: ticket.solicitante.nombre,
        solicitanteEmail: ticket.solicitante.email,
        tecnicoNombre: ticket.tecnico?.nombre,
        tecnicoEmail: ticket.tecnico?.email,
        comentario: dto.contenido,
      });
    }

    return comment;
  }
}
