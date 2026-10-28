import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
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
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTicketDto, solicitanteId: string) {
    return this.prisma.ticket.create({
      data: { ...dto, solicitanteId },
      include: TICKET_INCLUDE,
    });
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
    // Filtra comentarios internos para solicitantes
    if (rol === Role.SOLICITANTE) {
      return { ...ticket, comentarios: ticket.comentarios.filter((c) => !c.esInterno) };
    }
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, userId: string, rol: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const data: Record<string, unknown> = {};

    if (rol === Role.SOLICITANTE) {
      // Solicitante solo puede calificar cuando está RESUELTO
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

    return this.prisma.ticket.update({ where: { id }, data, include: TICKET_INCLUDE });
  }

  async addComment(ticketId: string, dto: CreateCommentDto, autorId: string, rol: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    if (dto.esInterno && rol === Role.SOLICITANTE) {
      throw new ForbiddenException('No podés crear comentarios internos');
    }

    return this.prisma.comment.create({
      data: { contenido: dto.contenido, esInterno: dto.esInterno ?? false, ticketId, autorId },
      include: { autor: { select: { id: true, nombre: true, rol: true } } },
    });
  }
}
