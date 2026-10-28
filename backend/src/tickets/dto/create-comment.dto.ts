import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsBoolean()
  @IsOptional()
  esInterno?: boolean;
}
