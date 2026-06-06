/**
 * MIDDLEWARE - Validación de API Key
 * 
 * Mantenimiento Adaptativo: Protege todas las rutas con API-Key en headers
 * 
 * Requerimiento: 
 * Header obligatorio: X-FIS-EPN-KEY con valor desde .env (X_FIS_EPN_KEY)
 * 
 * Respuesta de error (401):
 * {
 *   "statusCode": 401,
 *   "message": "API Key inválida o ausente",
 *   "timestamp": "2026-05-24T12:00:00.000Z"
 * }
 */

import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiKeyMiddleware.name);
  private readonly validApiKey: string;

  constructor(private readonly configService: ConfigService) {
    // Obtener la API Key desde variables de entorno
    this.validApiKey = this.configService.get<string>('X_FIS_EPN_KEY', 'X-FIS-EPN-KEY');
    this.logger.log(`✅ ApiKeyMiddleware inicializado. Esperando header X-FIS-EPN-KEY`);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Obtener el header X-FIS-EPN-KEY (case-insensitive en Express)
    const apiKeyFromHeader = req.headers['x-fis-epn-key'] as string;

    // Validar que el header esté presente
    if (!apiKeyFromHeader) {
      this.logger.warn(`❌ Request rechazado: API Key ausente desde ${req.ip}`);
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'API Key requerida en header X-FIS-EPN-KEY',
        timestamp: new Date().toISOString(),
      });
    }

    // Validar que el valor sea exactamente correcto
    if (apiKeyFromHeader !== this.validApiKey) {
      this.logger.warn(`❌ Request rechazado: API Key inválida desde ${req.ip}. Valor recibido: ${apiKeyFromHeader.substring(0, 5)}...`);
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'API Key inválida',
        timestamp: new Date().toISOString(),
      });
    }

    // API Key válida: permitir paso
    this.logger.debug(`✅ Request autorizado con API Key válida: ${req.method} ${req.path}`);
    next();
  }
}
