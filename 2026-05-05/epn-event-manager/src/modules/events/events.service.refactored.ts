/**
 * SERVICIO DE EVENTOS REFACTORIZADO
 * 
 * Versión ANTES (con deuda técnica):
 * - Bug en DELETE sin save()
 * - Fechas en formato local inconsistente
 * - Sin validaciones de entrada
 * - Sin manejo de errores
 * - Queries ineficientes en findAll()
 * 
 * Versión DESPUÉS (mantenida):
 * - Correctivo: Bug de persistencia eliminado
 * - Adaptativo: ISO-8601 estandarizado
 * - Preventivo: Validaciones robustas
 * - Perfectivo: Queries optimizadas
 */

import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto.refactored';
import { CreateEventEntity } from '../../database/entities/create-event.entity';
import { UpdateEventEntity } from '../../database/entities/update-event.entity';
import { DeleteEventEntity } from '../../database/entities/delete-event.entity';
import { QueryEventEntity } from '../../database/entities/query-event.entity';
import {
  getISOTimestamp,
  validateAndSanitizeString,
  validatePayload,
  serializePayload,
} from '../../common/utils/event.utils';

@Injectable()
export class EventsServiceRefactored {
  constructor(
    @InjectRepository(CreateEventEntity)
    private readonly createRepo: Repository<CreateEventEntity>,
    @InjectRepository(UpdateEventEntity)
    private readonly updateRepo: Repository<UpdateEventEntity>,
    @InjectRepository(DeleteEventEntity)
    private readonly deleteRepo: Repository<DeleteEventEntity>,
    @InjectRepository(QueryEventEntity)
    private readonly queryRepo: Repository<QueryEventEntity>,
  ) {}

  /**
   * Mantenimiento Preventivo: Registrar evento con validaciones completas
   * 
   * Flujo:
   * 1. Validar entrada
   * 2. Normalizar datos
   * 3. Persistir según acción
   * 4. Capturar errores
   */
  async registerEvent(dto: CreateEventDto): Promise<{ ok: boolean; message: string }> {
    try {
      // Mantenimiento Preventivo: Validar y normalizar campos de entrada
      const source = validateAndSanitizeString(dto.source, 100, 'source');
      const entity = validateAndSanitizeString(dto.entity, 100, 'entity');
      const action = validateAndSanitizeString(dto.action, 50, 'action').toUpperCase();
      const title = validateAndSanitizeString(dto.title, 255, 'title');
      const description = dto.description
        ? validateAndSanitizeString(dto.description, 1000, 'description')
        : null;

      // Mantenimiento Correctivo: Validar que payload sea un objeto válido
      const payload = validatePayload(dto.payload);
      const payloadStr = serializePayload(payload);

      // Mantenimiento Adaptativo: Usar ISO-8601 en lugar de toLocaleString()
      // Esto permite:
      // - Ordenamiento correcto en BD
      // - Parsing consistente en cualquier zona horaria
      // - Compatible con estándares internacionales
      const isoTimestamp = getISOTimestamp();

      // Mantenimiento Correctivo: Procesar según tipo de acción
      if (action === 'CREATE') {
        return await this.handleCreateEvent(
          source,
          entity,
          action,
          title,
          description,
          payloadStr,
          isoTimestamp
        );
      }

      if (action === 'UPDATE') {
        return await this.handleUpdateEvent(
          source,
          entity,
          action,
          title,
          description,
          payloadStr,
          isoTimestamp
        );
      }

      if (action === 'DELETE') {
        return await this.handleDeleteEvent(
          source,
          entity,
          action,
          title,
          payloadStr,
          isoTimestamp
        );
      }

      if (action === 'QUERY') {
        return await this.handleQueryEvent(
          source,
          entity,
          action,
          title,
          description,
          payloadStr,
          isoTimestamp
        );
      }

      // Mantenimiento Correctivo: Retornar error explícito si acción no reconocida
      throw new BadRequestException(`Acción no reconocida: ${action}`);
    } catch (error) {
      // Mantenimiento Preventivo: Capturar y loguear errores
      console.error('Error en registerEvent:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al registrar evento: ${error instanceof Error ? error.message : 'Desconocido'}`
      );
    }
  }

  /**
   * Mantenimiento Correctivo: Manejar CREATE de forma aislada
   * Facilita testing y debugging
   */
  private async handleCreateEvent(
    source: string,
    entity: string,
    action: string,
    title: string,
    description: string | null,
    payloadStr: string,
    isoTimestamp: string
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const ev = this.createRepo.create({
        source,
        entity,
        action,
        title,
        description: description || undefined, // Mantenimiento Correctivo: undefined para campos opcionales
        payload: payloadStr,
        recorded_at: isoTimestamp, // Mantenimiento Adaptativo: ISO-8601
      });

      await this.createRepo.save(ev);

      return { ok: true, message: 'Evento CREATE registrado exitosamente' };
    } catch (error) {
      // Mantenimiento Preventivo: Capturar errores específicos de BD
      console.error('Error guardando CREATE:', error);
      throw new InternalServerErrorException('Error al guardar evento CREATE');
    }
  }

  /**
   * Mantenimiento Correctivo: Manejar UPDATE de forma aislada
   */
  private async handleUpdateEvent(
    source: string,
    entity: string,
    action: string,
    title: string,
    description: string | null,
    payloadStr: string,
    isoTimestamp: string
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const ev = this.updateRepo.create({
        source,
        entity,
        action,
        title,
        description: description || undefined, // Mantenimiento Correctivo: undefined para campos opcionales
        payload: payloadStr,
        timestamp: isoTimestamp, // Mantenimiento Adaptativo: ISO-8601
      });

      await this.updateRepo.save(ev);

      return { ok: true, message: 'Evento UPDATE registrado exitosamente' };
    } catch (error) {
      console.error('Error guardando UPDATE:', error);
      throw new InternalServerErrorException('Error al guardar evento UPDATE');
    }
  }

  /**
   * 🔴 CORRECTIVO CRÍTICO: DELETE ahora persiste correctamente
   * 
   * ANTES (❌ BUGGY):
   * ```
   * this.deleteRepo.create({...});
   * return { ok: true };  // Nunca guarda!
   * ```
   * 
   * DESPUÉS (✅ CORRECTO):
   * ```
   * const ev = this.deleteRepo.create({...});
   * await this.deleteRepo.save(ev);  // Persiste correctamente
   * return { ok: true };
   * ```
   */
  private async handleDeleteEvent(
    source: string,
    entity: string,
    action: string,
    title: string,
    payloadStr: string,
    isoTimestamp: string
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const ev = this.deleteRepo.create({
        source,
        entity,
        action,
        title,
        payload: payloadStr,
        // Mantenimiento Correctivo: Usar campo estándar de timestamp
        createdAt: isoTimestamp,
      });

      // 🔴 MANTENIMIENTO CORRECTIVO: AGREGAR SAVE (bug fix)
      // Línea crítica: sin este await, el evento nunca se persiste en BD
      await this.deleteRepo.save(ev);

      return { ok: true, message: 'Evento DELETE registrado exitosamente' };
    } catch (error) {
      console.error('Error guardando DELETE:', error);
      throw new InternalServerErrorException('Error al guardar evento DELETE');
    }
  }

  /**
   * Mantenimiento Correctivo: Manejar QUERY de forma aislada
   */
  private async handleQueryEvent(
    source: string,
    entity: string,
    action: string,
    title: string,
    description: string | null,
    payloadStr: string,
    isoTimestamp: string
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const ev = this.queryRepo.create({
        source,
        entity,
        action,
        title,
        description: description || undefined, // Mantenimiento Correctivo: undefined para campos opcionales
        payload: payloadStr,
        event_date: isoTimestamp, // Mantenimiento Adaptativo: ISO-8601
      });

      await this.queryRepo.save(ev);

      return { ok: true, message: 'Evento QUERY registrado exitosamente' };
    } catch (error) {
      console.error('Error guardando QUERY:', error);
      throw new InternalServerErrorException('Error al guardar evento QUERY');
    }
  }

  /**
   * ANTES (❌):
   * - 4 queries separadas (N+1 problem)
   * - Merge en memoria sin orden garantizado
   * - Nombres de columnas diferentes en cada tabla
   * 
   * DESPUÉS (✅):
   * - Consultas tipadas
   * - Spread operators eficientes
   * - Mapeo consistente de campos
   */
  async findAll(): Promise<
    Array<{
      id: number;
      source: string;
      entity: string;
      action: string;
      title: string;
      description?: string;
      payload: string;
      timestamp: string;
      _table: string;
    }>
  > {
    try {
      // Mantenimiento Perfectivo: Realizar 4 queries en paralelo es más eficiente que secuencial
      const [creates, updates, deletes, queries] = await Promise.all([
        this.createRepo.find(),
        this.updateRepo.find(),
        this.deleteRepo.find(),
        this.queryRepo.find(),
      ]);

      // Mantenimiento Perfectivo: Mapear a estructura unificada con campo timestamp estándar
      const merged = [
        ...creates.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.recorded_at || getISOTimestamp(),
          _table: 'create_events',
        })),
        ...updates.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.timestamp || getISOTimestamp(),
          _table: 'update_events',
        })),
        ...deletes.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: '', // Delete no tiene descripción
          payload: e.payload || '{}',
          timestamp: e.createdAt || getISOTimestamp(),
          _table: 'delete_events',
        })),
        ...queries.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.event_date || getISOTimestamp(),
          _table: 'query_events',
        })),
      ];

      // Mantenimiento Perfectivo: Ordenar por timestamp ISO (ahora funciona correctamente)
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return merged;
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException('Error al obtener eventos');
    }
  }

  /**
   * Mantenimiento Correctivo: Buscar eventos por source
   */
  async findBySource(source: string): Promise<any[]> {
    try {
      const sanitizedSource = validateAndSanitizeString(source, 100, 'source');

      const creates = await this.createRepo.find({ where: { source: sanitizedSource } });
      const updates = await this.updateRepo.find({ where: { source: sanitizedSource } });
      const deletes = await this.deleteRepo.find({ where: { source: sanitizedSource } });
      const queries = await this.queryRepo.find({ where: { source: sanitizedSource } });

      const merged = [
        ...creates.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.recorded_at || getISOTimestamp(),
          _table: 'create_events',
        })),
        ...updates.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.timestamp || getISOTimestamp(),
          _table: 'update_events',
        })),
        ...deletes.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: '', // Delete no tiene descripción
          payload: e.payload || '{}',
          timestamp: e.createdAt || getISOTimestamp(),
          _table: 'delete_events',
        })),
        ...queries.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.event_date || getISOTimestamp(),
          _table: 'query_events',
        })),
      ];

      // Ordenar por timestamp
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return merged;
    } catch (error) {
      console.error('Error en findBySource:', error);
      throw new InternalServerErrorException('Error al obtener eventos por source');
    }
  }

  /**
   * Mantenimiento Correctivo: Buscar eventos por entity
   */
  async findByEntity(entity: string): Promise<any[]> {
    try {
      const sanitizedEntity = validateAndSanitizeString(entity, 100, 'entity');

      const creates = await this.createRepo.find({ where: { entity: sanitizedEntity } });
      const updates = await this.updateRepo.find({ where: { entity: sanitizedEntity } });
      const deletes = await this.deleteRepo.find({ where: { entity: sanitizedEntity } });
      const queries = await this.queryRepo.find({ where: { entity: sanitizedEntity } });

      const merged = [
        ...creates.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.recorded_at || getISOTimestamp(),
          _table: 'create_events',
        })),
        ...updates.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.timestamp || getISOTimestamp(),
          _table: 'update_events',
        })),
        ...deletes.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: '', // Delete no tiene descripción
          payload: e.payload || '{}',
          timestamp: e.createdAt || getISOTimestamp(),
          _table: 'delete_events',
        })),
        ...queries.map((e) => ({
          id: e.id,
          source: e.source || '',
          entity: e.entity || '',
          action: e.action || '',
          title: e.title || '',
          description: e.description,
          payload: e.payload || '{}',
          timestamp: e.event_date || getISOTimestamp(),
          _table: 'query_events',
        })),
      ];

      // Ordenar por timestamp
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return merged;
    } catch (error) {
      console.error('Error en findByEntity:', error);
      throw new InternalServerErrorException('Error al obtener eventos por entity');
    }
  }

  /**
   * PERFECTIVO: Obtener prenda más vendida según eventos
   * 
   * Caso de uso: Análisis de ventas
   * Entrada: Eventos de DELETE (venta implícita o reducción de stock)
   * Salida: Objeto con prenda más vendida y cantidad
   */
  async getMostSoldItem(): Promise<{
    item: string;
    count: number;
    lastSaleDate: string;
    revenue: number;
  } | null> {
    try {
      // Mantenimiento Perfectivo: Buscar eventos de DELETE (asumiendo = venta)
      const deleteEvents = await this.deleteRepo.find();

      if (deleteEvents.length === 0) {
        return null;
      }

      // Mantenimiento Perfectivo: Contar ocurrencias por nombre de prenda
      const itemCounts: Record<string, { count: number; lastDate: string; prices: number[] }> =
        {};

      deleteEvents.forEach((event) => {
        try {
          const payload = JSON.parse(event.payload || '{}');
          const itemName = payload.name || 'Unknown';
          const price = parseFloat(payload.price) || 0;

          if (!itemCounts[itemName]) {
            itemCounts[itemName] = { count: 0, lastDate: '', prices: [] };
          }

          itemCounts[itemName].count += 1;
          itemCounts[itemName].lastDate = event.createdAt || getISOTimestamp();
          itemCounts[itemName].prices.push(price);
        } catch (parseError) {
          console.warn('Error parsando payload en getMostSoldItem:', parseError);
        }
      });

      // Mantenimiento Perfectivo: Encontrar el artículo con más ventas
      const mostSold = Object.entries(itemCounts).reduce(
        (prev, [name, data]) =>
          data.count > prev.count ? { name, ...data } : prev,
        { name: 'Unknown', count: 0, lastDate: '', prices: [] }
      );

      // Mantenimiento Perfectivo: Calcular ingresos totales del artículo más vendido
      const totalRevenue = mostSold.prices.reduce((sum, price) => sum + price, 0);

      return {
        item: mostSold.name,
        count: mostSold.count,
        lastSaleDate: mostSold.lastDate,
        revenue: totalRevenue,
      };
    } catch (error) {
      console.error('Error en getMostSoldItem:', error);
      // Mantenimiento Preventivo: No lanzar excepción, solo loguear
      return null;
    }
  }
}
