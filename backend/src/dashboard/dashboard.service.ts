import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const [
      totalTickets,
      byStatus,
      byCategory,
      byPriority,
      byTechnician,
      avgResolutionRaw,
      avgRating,
      recentTickets,
    ] = await Promise.all([
      this.prisma.ticket.count(),

      this.prisma.ticket.groupBy({
        by: ['estado'],
        _count: { _all: true },
      }),

      this.prisma.ticket.groupBy({
        by: ['categoriaId'],
        _count: { _all: true },
      }),

      this.prisma.ticket.groupBy({
        by: ['prioridad'],
        _count: { _all: true },
      }),

      this.prisma.ticket.groupBy({
        by: ['tecnicoId'],
        _count: { _all: true },
        where: { tecnicoId: { not: null } },
      }),

      this.prisma.ticket.findMany({
        where: { fechaCierre: { not: null } },
        select: { fechaApertura: true, fechaCierre: true },
      }),

      this.prisma.ticket.aggregate({
        _avg: { calificacion: true },
        where: { calificacion: { not: null } },
      }),

      this.prisma.ticket.findMany({
        take: 10,
        orderBy: { fechaApertura: 'desc' },
        include: {
          categoria: { select: { nombre: true } },
          solicitante: { select: { nombre: true } },
          tecnico: { select: { nombre: true } },
        },
      }),
    ]);

    // Average resolution time in hours
    const avgResolutionHours =
      avgResolutionRaw.length > 0
        ? avgResolutionRaw.reduce((acc, t) => {
            const ms = new Date(t.fechaCierre!).getTime() - new Date(t.fechaApertura).getTime();
            return acc + ms / 3_600_000;
          }, 0) / avgResolutionRaw.length
        : null;

    // Enrich byCategory with category names
    const categories = await this.prisma.category.findMany({ select: { id: true, nombre: true } });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.nombre]));

    // Enrich byTechnician with names
    const techIds = byTechnician.map((t) => t.tecnicoId).filter(Boolean) as string[];
    const technicians = techIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: techIds } }, select: { id: true, nombre: true } })
      : [];
    const techMap = Object.fromEntries(technicians.map((t) => [t.id, t.nombre]));

    return {
      totalTickets,
      byStatus: byStatus.map((s) => ({ estado: s.estado, count: s._count._all })),
      byCategory: byCategory.map((c) => ({
        categoria: catMap[c.categoriaId] ?? c.categoriaId,
        count: c._count._all,
      })),
      byPriority: byPriority.map((p) => ({ prioridad: p.prioridad, count: p._count._all })),
      byTechnician: byTechnician.map((t) => ({
        tecnico: techMap[t.tecnicoId!] ?? 'Sin asignar',
        count: t._count._all,
      })),
      avgResolutionHours: avgResolutionHours ? Math.round(avgResolutionHours * 10) / 10 : null,
      avgRating: avgRating._avg.calificacion
        ? Math.round(avgRating._avg.calificacion * 10) / 10
        : null,
      recentTickets,
    };
  }
}
