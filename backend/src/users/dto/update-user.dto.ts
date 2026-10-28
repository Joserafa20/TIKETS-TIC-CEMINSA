import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsEnum(Role)
  @IsOptional()
  rol?: Role;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
