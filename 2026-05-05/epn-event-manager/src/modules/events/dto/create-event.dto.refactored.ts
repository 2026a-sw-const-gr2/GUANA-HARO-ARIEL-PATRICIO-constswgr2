/**
 * DTO REFACTORIZADO - Create Event
 * 
 * MEJORAS APLICADAS:
 * - Mantenimiento Preventivo: Validaciones en decoradores
 * - Mantenimiento Adaptativo: Timestamps estandarizados
 * - Mantenimiento Correctivo: Restricción de longitud en strings
 */

import { IsNotEmpty, IsString, MaxLength, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  // Mantenimiento Preventivo: Validar que source no esté vacío
  @IsNotEmpty({ message: 'source no puede estar vacío' })
  @IsString()
  @MaxLength(100, { message: 'source máximo 100 caracteres' })
  source: string;

  // Mantenimiento Preventivo: Validar que entity no esté vacío
  @IsNotEmpty({ message: 'entity no puede estar vacío' })
  @IsString()
  @MaxLength(100, { message: 'entity máximo 100 caracteres' })
  entity: string;

  // Mantenimiento Preventivo: Validar que action sea válido
  @IsNotEmpty({ message: 'action no puede estar vacío' })
  @IsString()
  action: string;

  // Mantenimiento Preventivo: Validar longitud de title
  @IsNotEmpty({ message: 'title no puede estar vacío' })
  @IsString()
  @MaxLength(255, { message: 'title máximo 255 caracteres' })
  title: string;

  // Mantenimiento Preventivo: Descripción opcional con límite
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'description máximo 1000 caracteres' })
  description?: string;

  // Mantenimiento Correctivo: Validar que payload sea un objeto válido
  @IsNotEmpty({ message: 'payload no puede estar vacío' })
  @IsObject({ message: 'payload debe ser un objeto JSON válido' })
  @Type(() => Object)
  payload: Record<string, any>;

  // Mantenimiento Adaptativo: Timestamp ISO-8601 opcional (servidor establece si no se envía)
  @IsOptional()
  @IsString()
  timestamp?: string;
}
