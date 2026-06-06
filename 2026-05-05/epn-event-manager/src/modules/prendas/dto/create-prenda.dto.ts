/**
 * DTO - Crear Prenda
 * 
 * Mantenimiento Preventivo: Validaciones en decoradores
 * Mantenimiento Correctivo: Restricciones de datos
 * Mantenimiento Adaptativo: Validaciones desde configuración
 */

import { IsNotEmpty, IsString, MaxLength, IsDecimal, IsInt, Min, Max, IsOptional, IsIn, Matches } from 'class-validator';

const SAFE_TEXT_PATTERN = /^[^<>$%{}\[\]()*\/\\|;]+$/;

export class CreatePrendaDto {
  // Mantenimiento Preventivo: Nombre obligatorio y con límite
  @IsNotEmpty({ message: 'El nombre de la prenda es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'El nombre contiene caracteres inválidos o potencialmente peligrosos' })
  name: string;

  // Descripción opcional
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'La descripción contiene caracteres inválidos o potencialmente peligrosos' })
  description?: string;

  // Mantenimiento Preventivo: Talla debe ser valor válido
  @IsNotEmpty({ message: 'La talla es obligatoria' })
  @IsIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
    message: 'Talla inválida. Valores permitidos: XS, S, M, L, XL, XXL',
  })
  size: string;

  // Mantenimiento Preventivo: Precio positivo con 2 decimales
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @IsDecimal({ decimal_digits: '2' }, { message: 'El precio debe tener máximo 2 decimales' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Max(9999999, { message: 'El precio excede el límite permitido' })
  price: number;

  // Mantenimiento Preventivo: Stock no negativo
  @IsNotEmpty({ message: 'El stock es obligatorio' })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Max(9999999, { message: 'El stock excede el límite permitido' })
  stock: number;

  // Color opcional
  @IsOptional()
  @IsString({ message: 'El color debe ser texto' })
  @MaxLength(100, { message: 'El color no puede exceder 100 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'El color contiene caracteres inválidos o potencialmente peligrosos' })
  color?: string;

  // Material opcional
  @IsOptional()
  @IsString({ message: 'El material debe ser texto' })
  @MaxLength(100, { message: 'El material no puede exceder 100 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'El material contiene caracteres inválidos o potencialmente peligrosos' })
  material?: string;
}
