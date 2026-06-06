/**
 * UTILIDADES DE SANITIZACIÓN E INYECCIÓN
 *
 * Mantenimiento Preventivo: Controlar datos entrantes y evitar caracteres peligrosos.
 */

const injectionRegex = /[<>$%{}\[\]()*\/\\|;]/;
const sqlCommentRegex = /(--)|(\/\*)|(\*\/)/;

export function sanitizeString(
  value: unknown,
  fieldName: string,
  maxLength: number,
  allowEmpty = false,
): string {
  if (value === null || value === undefined) {
    if (allowEmpty) {
      return '';
    }
    throw new Error(`${fieldName} es obligatorio`);
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} debe ser un texto`);
  }

  const trimmed = value.trim();

  if (!allowEmpty && trimmed.length === 0) {
    throw new Error(`${fieldName} no puede estar vacío`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} excede el máximo de ${maxLength} caracteres`);
  }

  if (injectionRegex.test(trimmed) || sqlCommentRegex.test(trimmed.toLowerCase())) {
    throw new Error(`${fieldName} contiene caracteres inválidos o potencialmente peligrosos`);
  }

  return trimmed.replace(/\s+/g, ' ');
}

export function sanitizeSize(value: unknown): string {
  const allowedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const normalized = sanitizeString(value, 'Talla', 10);
  const uppercase = normalized.toUpperCase();

  if (!allowedSizes.includes(uppercase)) {
    throw new Error(`Talla inválida. Valores permitidos: ${allowedSizes.join(', ')}`);
  }

  return uppercase;
}

export function sanitizeDecimal(
  value: unknown,
  fieldName: string,
  min = 0,
  max = 9999999,
  decimals = 2,
): number {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} es obligatorio`);
  }

  if (typeof value !== 'number') {
    throw new Error(`${fieldName} debe ser numérico`);
  }

  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} debe ser un número finito`);
  }

  if (value < min || value > max) {
    throw new Error(`${fieldName} debe estar entre ${min} y ${max}`);
  }

  const [_, fraction = ''] = value.toString().split('.');
  if (fraction.length > decimals) {
    throw new Error(`${fieldName} debe tener máximo ${decimals} decimales`);
  }

  return Number(value.toFixed(decimals));
}

export function sanitizeInteger(value: unknown, fieldName: string, min = 0, max = 9999999): number {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} es obligatorio`);
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${fieldName} debe ser un número entero`);
  }

  if (value < min || value > max) {
    throw new Error(`${fieldName} debe estar entre ${min} y ${max}`);
  }

  return value;
}

export function sanitizeId(value: unknown): string {
  const trimmed = sanitizeString(value, 'ID', 36);
  if (!/^[0-9a-fA-F-]{1,36}$/.test(trimmed)) {
    throw new Error('ID contiene caracteres inválidos');
  }
  return trimmed;
}
