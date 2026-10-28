import { Priority, TicketStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateTicketDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  estado?: TicketStatus;

  @IsEnum(Priority)
  @IsOptional()
  prioridad?: Priority;

  @IsString()
  @IsOptional()
  tecnicoId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  calificacion?: number;

  @IsString()
  @IsOptional()
  comentarioCalif?: string;
}
