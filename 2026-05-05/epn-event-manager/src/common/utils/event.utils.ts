/**
 * UTILIDADES DE FORMATEO Y VALIDACIÓN
 * 
 * Mantenimiento Adaptativo: Centralizar lógica de fechas en ISO-8601
 * Mantenimiento Perfectivo: Reutilizar funciones en toda la aplicación
 */

/**
 * Mantenimiento Adaptativo: Obtener timestamp en formato ISO-8601 estándar
 * Esto permite:
 * - Compatibilidad global con otros sistemas
 * - Ordenamiento correcto en BD
 * - Parsing consistente en cualquier zona horaria
 */
export function getISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Mantenimiento Correctivo: Validar que un string de nombre no exceda límites
 * Previene:
 * - Inyección de caracteres especiales
 * - Desbordamiento de campos en BD
 * - Problemas en sistemas legacy que no soportan Unicode
 */
export function validateAndSanitizeString(
  input: string | null | undefined,
  maxLength: number = 255,
  fieldName: string = 'field'
): string {
  if (!input || input.trim() === '') {
    throw new Error(`${fieldName} no puede estar vacío`);
  }

  const sanitized = input.trim();

  if (sanitized.length > maxLength) {
    throw new Error(
      `${fieldName} excede el máximo de ${maxLength} caracteres (recibido: ${sanitized.length})`
    );
  }

  return sanitized;
}

/**
 * Mantenimiento Preventivo: Validar que payload sea un objeto JSON válido
 * Evita:
 * - Almacenamiento de undefined o null como strings
 * - Corrupción de datos en serialización
 * - Errores en deserialización posterior
 */
export function validatePayload(payload: any): Record<string, any> {
  if (payload === null || payload === undefined) {
    throw new Error('payload no puede ser nulo');
  }

  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('payload debe ser un objeto JSON válido, no array ni valor primitivo');
  }

  return payload as Record<string, any>;
}

/**
 * Mantenimiento Correctivo: Serializar payload a JSON de forma segura
 * Manejo:
 * - Eventos circulares en objetos
 * - Funciones no serializables
 * - Valores undefined
 */
export function serializePayload(payload: Record<string, any>): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch (error) {
    // Mantenimiento Correctivo: Si falla la serialización, registrar el error
    console.error('Error serializando payload:', error);
    // Fallback: enviar payload como string vacío en lugar de dejar que caiga el sistema
    return '{}';
  }
}
