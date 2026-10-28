import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TECNICO)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('pdf')
  async pdf(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const buffer = await this.service.generatePdf(from, to);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-tickets.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('excel')
  async excel(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const buffer = await this.service.generateExcel(from, to);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-tickets.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
