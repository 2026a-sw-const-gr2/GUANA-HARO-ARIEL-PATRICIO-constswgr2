/**
 * CONTROLADOR REFACTORIZADO - Events
 * 
 * Mejoras:
 * - Validación automática con class-validator en DTOs
 * - Manejo global de errores vía ExceptionFilter
 * - Headers de seguridad básico
 */

import { Body, Controller, Get, Param, Post, Headers, Logger } from '@nestjs/common';
import { EventsServiceRefactored } from './events.service.refactored';
import { CreateEventDto } from './dto/create-event.dto.refactored';

@Controller('events')
export class EventsControllerRefactored {
  private readonly logger = new Logger(EventsControllerRefactored.name);

  constructor(private readonly eventsService: EventsServiceRefactored) {}

  /**
   * Mantenimiento Adaptativo: Capturar headers de seguridad básico
   * POST /events
   * Headers esperados: x-api-key (opcional para esta fase)
   */
  @Post()
  async registerEvent(
    @Body() dto: CreateEventDto,
    // Mantenimiento Adaptativo: Validar header de seguridad básico
    @Headers('x-api-key') apiKey?: string
  ) {
    // Mantenimiento Preventivo: Loguear el evento recibido para auditoría
    this.logger.log(
      `Evento recibido: ${dto.action} de ${dto.source} para ${dto.entity}`
    );

    // Mantenimiento Adaptativo: Validación básica de seguridad
    // En producción, implementar validación más robusta
    if (apiKey && apiKey !== 'development-key') {
      this.logger.warn(`Intento de acceso con API key inválida`);
      // En producción: lanzar UnauthorizedException
    }

    return await this.eventsService.registerEvent(dto);
  }

  /**
   * Mantenimiento Perfectivo: Obtener todos los eventos
   * GET /events
   */
  @Get()
  async findAll() {
    return await this.eventsService.findAll();
  }

  /**
   * Mantenimiento Correctivo: Buscar por source con validación
   * GET /events/source/:source
   */
  @Get('source/:source')
  async findBySource(@Param('source') source: string) {
    return await this.eventsService.findBySource(source);
  }

  /**
   * Mantenimiento Correctivo: Buscar por entity con validación
   * GET /events/entity/:entity
   */
  @Get('entity/:entity')
  async findByEntity(@Param('entity') entity: string) {
    return await this.eventsService.findByEntity(entity);
  }

  /**
   * PERFECTIVO NUEVO: Obtener prenda más vendida
   * GET /events/stats/most-sold
   * 
   * Retorna:
   * {
   *   item: "Camiseta XL",
   *   count: 45,
   *   lastSaleDate: "2026-05-07T14:30:00Z",
   *   revenue: 2250.00
   * }
   */
  @Get('stats/most-sold')
  async getMostSoldItem() {
    const result = await this.eventsService.getMostSoldItem();
    return result || { message: 'No hay datos de ventas disponibles' };
  }
}
