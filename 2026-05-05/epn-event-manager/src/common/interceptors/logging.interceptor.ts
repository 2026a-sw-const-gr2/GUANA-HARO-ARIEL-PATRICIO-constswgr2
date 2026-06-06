/**
 * INTERCEPTOR - Logging Automático
 * 
 * Mantenimiento Perfectivo: Elimina código repetitivo de try-catch-finally
 * Registra automáticamente entrada, salida y errores de cada endpoint
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { logCrudAction } from '../logger/crud.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const endpoint = `${method} ${path}`;

    const startTime = Date.now();
    this.logger.log(`➡️ ${endpoint} - INICIADO`);

    return next.handle().pipe(
      tap(async (data) => {
        const duration = Date.now() - startTime;
        this.logger.log(`✅ ${endpoint} - COMPLETADO en ${duration}ms`);
        await logCrudAction('info', `${endpoint} - Exitoso`, undefined);
        return data;
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `❌ ${endpoint} - ERROR después de ${duration}ms: ${error.message}`,
        );
        await logCrudAction('error', `${endpoint} - Error: ${error.message}`);
        return throwError(() => error);
      }),
    );
  }
}
