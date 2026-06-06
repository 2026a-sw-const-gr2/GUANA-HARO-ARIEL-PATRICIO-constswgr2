/**
 * LOGGER CRUD - Estructurado con Winston
 * 
 * Mantenimiento Correctivo: Logger profesional con:
 * - Formato JSON exacto requerido
 * - Timestamp en ISO-8601
 * - Severidad: INFO, WARN, ERROR
 * - Registros asíncronos (no bloqueantes)
 * - Persistencia en archivo + consola
 * 
 * Formato esperado:
 * {"timestamp": "2026-05-24T12:00:00.000Z", "level": "INFO", "message": "...", "entityId": "uuid-123"}
 */

import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Formato personalizado JSON estrictamente según especificación
 */
const jsonFormat = winston.format.printf(({ timestamp, level, message, entityId }) => {
  return JSON.stringify({
    timestamp: timestamp || new Date().toISOString(),
    level: level.toUpperCase(),
    message: message || 'N/A',
    entityId: entityId || 'N/A',
  });
});

/**
 * Logger principal CRUD con Winston
 * Soporta múltiples transports: archivo + consola
 */
export const crudLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    // Timestamp en ISO-8601 automático
    winston.format.timestamp({
      format: 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]',
    }),
    // Formato JSON personalizado
    jsonFormat
  ),
  defaultMeta: { service: 'prendas-crud' },
  transports: [
    // Archivo para errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Archivo combinado para todas las severidades
    new winston.transports.File({
      filename: path.join(logsDir, 'crud.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    // Consola con colores en desarrollo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, entityId }) => {
          return `[${timestamp}] [${level}] ${message} (entityId: ${entityId})`;
        })
      ),
    }),
  ],
});

/**
 * Interface para registros CRUD
 */
interface CrudLogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  entityId?: string;
}

/**
 * Loguea acciones CRUD de forma ASÍNCRONA (no bloqueante)
 * 
 * @param level - Severidad: 'info', 'warn', 'error'
 * @param message - Mensaje descriptivo
 * @param entityId - ID de la prenda/entidad (opcional)
 */
export const logCrudAction = (
  level: 'info' | 'warn' | 'error',
  message: string,
  entityId: string = 'N/A'
): Promise<void> => {
  return new Promise((resolve) => {
    // Ejecutar de forma asíncrona con setImmediate (no bloqueante)
    setImmediate(() => {
      const logEntry: CrudLogEntry = {
        level,
        message,
        entityId,
      };

      // Loguear según severidad
      switch (level) {
        case 'info':
          crudLogger.info(message, { entityId });
          break;
        case 'warn':
          crudLogger.warn(message, { entityId });
          break;
        case 'error':
          crudLogger.error(message, { entityId });
          break;
        default:
          crudLogger.info(message, { entityId });
      }

      // Resolver promesa después de loguear
      resolve();
    });
  });
};

/**
 * Loguea en contexto de transacción asíncrona
 * Útil para operaciones que generan múltiples logs
 */
export const logCrudTransaction = async (
  transactionId: string,
  logEntries: CrudLogEntry[]
): Promise<void> => {
  for (const entry of logEntries) {
    await logCrudAction(entry.level, entry.message, entry.entityId || transactionId);
  }
};

