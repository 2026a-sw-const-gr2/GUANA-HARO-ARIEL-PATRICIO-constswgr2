/**
 * CONFIGURACIÓN CENTRALIZADA
 * 
 * Todas las constantes y configuraciones se leen desde variables de entorno (.env)
 * Mantenimiento Adaptativo: Externalizar toda la configuración
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  constructor(private configService: ConfigService) {}

  // ============================================================
  // 🌐 Configuración del Servidor
  // ============================================================
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }

  // ============================================================
  // 📦 Base de Datos
  // ============================================================
  get databasePath(): string {
    return this.configService.get<string>('DATABASE_PATH', './db/event-manager.db');
  }

  get dbPath(): string {
    return this.configService.get<string>('DB_PATH', 'db/events.sqlite');
  }

  // ============================================================
  // 🔑 Seguridad
  // ============================================================
  get apiKey(): string {
    return this.configService.get<string>('X_FIS_EPN_KEY', 'X-FIS-EPN-KEY');
  }

  // ============================================================
  // 📝 Logging
  // ============================================================
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'debug');
  }

  get logFilePath(): string {
    return this.configService.get<string>('LOG_FILE_PATH', './logs/crud.log');
  }

  get logConsoleFormat(): string {
    return this.configService.get<string>('LOG_CONSOLE_FORMAT', 'json');
  }

  // ============================================================
  // 🔗 Integraciones
  // ============================================================
  get eventManagerTimeoutMs(): number {
    return this.configService.get<number>('EVENT_MANAGER_TIMEOUT_MS', 5000);
  }

  get eventManagerRetryAttempts(): number {
    return this.configService.get<number>('EVENT_MANAGER_RETRY_ATTEMPTS', 3);
  }

  // ============================================================
  // 📊 Límites de la API
  // ============================================================
  get maxRequestSize(): string {
    return this.configService.get<string>('MAX_REQUEST_SIZE', '10mb');
  }

  get requestTimeoutMs(): number {
    return this.configService.get<number>('REQUEST_TIMEOUT_MS', 30000);
  }

  // ============================================================
  // 🎯 Configuración de Prendas (Ropa)
  // ============================================================
  get prendasPageSize(): number {
    return this.configService.get<number>('PRENDAS_PAGE_SIZE', 20);
  }

  get prendasMaxNameLength(): number {
    return this.configService.get<number>('PRENDAS_MAX_NAME_LENGTH', 255);
  }

  get prendasMaxDescriptionLength(): number {
    return this.configService.get<number>('PRENDAS_MAX_DESCRIPTION_LENGTH', 1000);
  }

  // Validaciones de talla
  get validSizes(): string[] {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }

  // Límites de precio
  get minPrice(): number {
    return 0;
  }

  get maxPrice(): number {
    return 9999999;
  }

  // Límites de stock
  get minStock(): number {
    return 0;
  }

  get maxStock(): number {
    return 9999999;
  }
}
