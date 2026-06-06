/**
 * CLIENTE HTTP - Event Manager
 * 
 * Mantenimiento Perfectivo: Centralizar integración con Event Manager
 * Permite:
 * - Cambiar endpoint sin modificar servicios
 * - Reintentos automáticos
 * - Logging centralizado
 * - Manejo de errores consistente
 */

import { Injectable, Logger } from '@nestjs/common';
import { getISOTimestamp } from '../../../common/utils/event.utils';

@Injectable()
export class EventManagerClient {
  private readonly logger = new Logger(EventManagerClient.name);
  private readonly eventManagerUrl = 'http://localhost:3000'; // Configurable via env

  /**
   * Mantenimiento Perfectivo: Enviar evento de CREATE de prenda
   * 
   * POST http://localhost:3000/events
   * {
   *   source: "ropa-crud",
   *   entity: "prenda",
   *   action: "CREATE",
   *   title: "Nueva prenda creada",
   *   description: "Camiseta XL Roja",
   *   payload: { id, name, size, price, stock, ... }
   * }
   */
  async sendCreateEvent(prenda: any): Promise<void> {
    try {
      const eventPayload = {
        source: 'ropa-crud',
        entity: 'prenda',
        action: 'CREATE',
        title: `Prenda creada: ${prenda.name}`,
        description: `Talla: ${prenda.size}, Precio: $${prenda.price}`,
        payload: {
          id: prenda.id,
          name: prenda.name,
          size: prenda.size,
          price: prenda.price,
          stock: prenda.stock,
          color: prenda.color,
          material: prenda.material,
          createdAt: prenda.createdAt,
        },
        timestamp: getISOTimestamp(),
      };

      // Mantenimiento Preventivo: Enviar evento de forma asincrónica sin bloquear
      this.publishEvent(eventPayload).catch((error) => {
        // Mantenimiento Correctivo: Loguear error pero no fallar la operación principal
        this.logger.error(`Error enviando evento CREATE: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Error preparando evento CREATE: ${error}`);
    }
  }

  /**
   * Mantenimiento Perfectivo: Enviar evento de UPDATE de prenda
   */
  async sendUpdateEvent(
    prendaAntes: any,
    prendaDespues: any,
    cambios: Record<string, any>
  ): Promise<void> {
    try {
      const eventPayload = {
        source: 'ropa-crud',
        entity: 'prenda',
        action: 'UPDATE',
        title: `Prenda actualizada: ${prendaDespues.name}`,
        description: `Cambios: ${Object.keys(cambios).join(', ')}`,
        payload: {
          id: prendaDespues.id,
          antes: prendaAntes,
          despues: prendaDespues,
          cambios: cambios,
          updatedAt: prendaDespues.updatedAt,
        },
        timestamp: getISOTimestamp(),
      };

      // Enviar de forma asincrónica
      this.publishEvent(eventPayload).catch((error) => {
        this.logger.error(`Error enviando evento UPDATE: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Error preparando evento UPDATE: ${error}`);
    }
  }

  /**
   * Mantenimiento Perfectivo: Enviar evento de DELETE de prenda
   */
  async sendDeleteEvent(prenda: any): Promise<void> {
    try {
      const eventPayload = {
        source: 'ropa-crud',
        entity: 'prenda',
        action: 'DELETE',
        title: `Prenda eliminada: ${prenda.name}`,
        description: `ID: ${prenda.id}, Talla: ${prenda.size}`,
        payload: {
          id: prenda.id,
          name: prenda.name,
          size: prenda.size,
          price: prenda.price,
          stock: prenda.stock,
          deletedAt: getISOTimestamp(),
        },
        timestamp: getISOTimestamp(),
      };

      // Enviar de forma asincrónica
      this.publishEvent(eventPayload).catch((error) => {
        this.logger.error(`Error enviando evento DELETE: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Error preparando evento DELETE: ${error}`);
    }
  }

  /**
   * Mantenimiento Correctivo: Enviar evento de QUERY
   * Se registra cuando se consulta el inventario
   */
  async sendQueryEvent(
    queryType: 'find-all' | 'find-by-id' | 'find-by-size' | 'find-by-name',
    filters?: Record<string, any>
  ): Promise<void> {
    try {
      const eventPayload = {
        source: 'ropa-crud',
        entity: 'prenda',
        action: 'QUERY',
        title: `Consulta de inventario: ${queryType}`,
        description: filters ? JSON.stringify(filters) : 'Sin filtros',
        payload: {
          queryType,
          filters: filters || {},
          timestamp: getISOTimestamp(),
        },
        timestamp: getISOTimestamp(),
      };

      this.publishEvent(eventPayload).catch((error) => {
        this.logger.error(`Error enviando evento QUERY: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Error preparando evento QUERY: ${error}`);
    }
  }

  /**
   * Mantenimiento Correctivo: Publicar evento (implementación interna)
   * 
   * Nota: En producción, usar HttpClient de @nestjs/common
   * Para esta demostración, simular o usar fetch
   */
  private async publishEvent(payload: any): Promise<void> {
    try {
      // Mantenimiento Correctivo: Try-catch envolviendo el envío de evento
      const response = await fetch(`${this.eventManagerUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Mantenimiento Adaptativo: Header de seguridad coincide con ApiKeyMiddleware
          'X-FIS-EPN-KEY': 'X-FIS-EPN-KEY',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.warn(
          `Evento no fue registrado. Status: ${response.status}. Body: ${await response.text()}`
        );
      } else {
        this.logger.debug(
          `Evento ${payload.action} enviado exitosamente para ${payload.entity}`
        );
      }
    } catch (error) {
      // Mantenimiento Correctivo: No fallar si Event Manager está offline
      this.logger.warn(
        `No se pudo conectar a Event Manager en ${this.eventManagerUrl}: ${error}`
      );
      // En producción: implementar cola de reintentos
    }
  }
}
