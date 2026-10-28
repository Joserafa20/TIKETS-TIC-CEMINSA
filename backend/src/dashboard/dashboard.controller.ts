import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TECNICO)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  getMetrics() {
    return this.service.getMetrics();
  }
}
