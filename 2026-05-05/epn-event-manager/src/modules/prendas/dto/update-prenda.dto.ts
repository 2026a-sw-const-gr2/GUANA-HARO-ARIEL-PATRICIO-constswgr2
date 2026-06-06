/**
 * DTO - Actualizar Prenda
 * 
 * Similar a CreatePrendaDto pero todos los campos son opcionales
 * Mantenimiento Correctivo: Validaciones mejoradas
 * Mantenimiento Adaptativo: Sincronizado con configuración
 */

import { IsOptional, IsString, MaxLength, IsDecimal, IsInt, Min, Max, IsIn, Matches } from 'class-validator';

const SAFE_TEXT_PATTERN = /^[^<>$%{}\[\]()*\/\\|;]+$/;

export class UpdatePrendaDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'El nombre contiene caracteres inválidos o potencialmente peligrosos' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'La descripción contiene caracteres inválidos o potencialmente peligrosos' })
  description?: string;

  @IsOptional()
  @IsIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
    message: 'Talla inválida. Valores permitidos: XS, S, M, L, XL, XXL',
  })
  size?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' }, { message: 'El precio debe tener máximo 2 decimales' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Max(9999999, { message: 'El precio excede el límite permitido' })
  price?: number;

  @IsOptional()
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Max(9999999, { message: 'El stock excede el límite permitido' })
  stock?: number;

  @IsOptional()
  @IsString({ message: 'El color debe ser texto' })
  @MaxLength(100, { message: 'El color no puede exceder 100 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'El color contiene caracteres inválidos o potencialmente peligrosos' })
  color?: string;

  @IsOptional()
  @IsString({ message: 'El material debe ser texto' })
  @MaxLength(100, { message: 'El material no puede exceder 100 caracteres' })
  @Matches(SAFE_TEXT_PATTERN, { message: 'El material contiene caracteres inválidos o potencialmente peligrosos' })
  material?: string;
}
