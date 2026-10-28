import { Priority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;

  @IsEnum(Priority)
  @IsOptional()
  prioridad?: Priority;

  @IsString()
  @IsOptional()
  sede?: string;

  @IsString()
  @IsOptional()
  equipoDe?: string;
}
