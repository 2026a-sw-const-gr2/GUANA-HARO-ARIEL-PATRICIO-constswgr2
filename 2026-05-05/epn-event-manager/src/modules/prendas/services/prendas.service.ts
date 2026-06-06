/**
 * SERVICIO - Prendas CRUD
 * 
 * Responsabilidades:
 * - Operaciones CRUD en base de datos
 * - Integración con Event Manager
 * - Validaciones de negocio
 * - Manejo de errores
 */

import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PrendaEntity } from '../entities/prenda.entity';
import { CreatePrendaDto } from '../dto/create-prenda.dto';
import { UpdatePrendaDto } from '../dto/update-prenda.dto';
import { EventManagerClient } from '../clients/event-manager.client';
import { logCrudAction } from '../../../common/logger/crud.logger';
import {
  sanitizeString,
  sanitizeSize,
  sanitizeDecimal,
  sanitizeInteger,
  sanitizeId,
} from '../../../common/utils/sanitization.utils';

@Injectable()
export class PrendasService {
  private readonly logger = new Logger(PrendasService.name);

  constructor(
    @InjectRepository(PrendaEntity)
    private readonly prendaRepository: Repository<PrendaEntity>,
    private readonly eventManagerClient: EventManagerClient,
  ) {}

  private safeSanitizeString(value: unknown, fieldName: string, maxLength: number, allowEmpty = false): string {
    try {
      return sanitizeString(value, fieldName, maxLength, allowEmpty);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : `${fieldName} inválido`);
    }
  }

  private safeSanitizeSize(value: unknown): string {
    try {
      return sanitizeSize(value);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Talla inválida');
    }
  }

  private safeSanitizeDecimal(value: unknown, fieldName: string): number {
    try {
      return sanitizeDecimal(value, fieldName, 0, 9999999, 2);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : `${fieldName} inválido`);
    }
  }

  private safeSanitizeInteger(value: unknown, fieldName: string): number {
    try {
      return sanitizeInteger(value, fieldName, 0, 9999999);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : `${fieldName} inválido`);
    }
  }

  private safeSanitizeId(value: unknown): string {
    try {
      return sanitizeId(value);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'ID inválido');
    }
  }

  /**
   * 🟢 CREATE - Crear nueva prenda
   * 
   * Flujo:
   * 1. Validar datos (automático vía DTO)
   * 2. Crear entidad
   * 3. Guardar en BD
   * 4. Enviar evento al Event Manager
   */
  async create(createPrendaDto: CreatePrendaDto): Promise<PrendaEntity> {
    try {
      const nameNorm = this.safeSanitizeString(createPrendaDto.name, 'Nombre', 255);
      const sizeNorm = this.safeSanitizeSize(createPrendaDto.size);
      const descriptionNorm = createPrendaDto.description !== undefined
        ? this.safeSanitizeString(createPrendaDto.description, 'Descripción', 1000, true)
        : null;
      const colorNorm = createPrendaDto.color !== undefined
        ? this.safeSanitizeString(createPrendaDto.color, 'Color', 100, true)
        : null;
      const materialNorm = createPrendaDto.material !== undefined
        ? this.safeSanitizeString(createPrendaDto.material, 'Material', 100, true)
        : null;
      const priceNorm = this.safeSanitizeDecimal(createPrendaDto.price, 'Precio');
      const stockNorm = this.safeSanitizeInteger(createPrendaDto.stock, 'Stock');

      // Mantenimiento Correctivo: Validar que no haya prenda duplicada con mismo nombre y talla
      try {
        const existente = await this.prendaRepository.findOne({
          where: {
            name: nameNorm,
            size: sizeNorm,
            isDeleted: false,
          },
        });

        if (existente) {
          await logCrudAction('warn', `Intento de crear prenda duplicada: ${nameNorm} en talla ${sizeNorm}`, existente.id);
          throw new BadRequestException(
            `Ya existe una prenda "${nameNorm}" en talla ${sizeNorm}`
          );
        }
      } catch (queryError) {
        if (queryError instanceof BadRequestException) {
          throw queryError;
        }
        this.logger.error(`Error validando duplicados: ${queryError}`);
        await logCrudAction('error', `Error en validación de duplicados para ${nameNorm}`);
        throw new InternalServerErrorException('Error al validar duplicados');
      }

      // Mantenimiento Preventivo: Crear entidad con validaciones
      const prenda = this.prendaRepository.create({
        name: nameNorm,
        description: descriptionNorm,
        size: sizeNorm,
        price: priceNorm,
        stock: stockNorm,
        color: colorNorm,
        material: materialNorm,
        isDeleted: false,
      });

      // Guardar en BD
      const prendaGuardada = await this.prendaRepository.save(prenda);

      // Mantenimiento Perfectivo: Enviar evento CREATE de forma NO BLOQUEANTE
      this.eventManagerClient.sendCreateEvent(prendaGuardada);

      await logCrudAction('info', `Prenda creada exitosamente: ${prendaGuardada.name}`, prendaGuardada.id);

      return prendaGuardada;
    } catch (error) {
      // Mantenimiento Preventivo: Capturar y loguear error
      this.logger.error(`Error creando prenda: ${error}`);
      await logCrudAction('error', `Error creando prenda: ${error instanceof Error ? error.message : 'Desconocido'}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al crear prenda: ${error instanceof Error ? error.message : 'Desconocido'}`
      );
    } finally {
      await logCrudAction('info', 'create() finalizado');
    }
  }

  /**
   * 🔵 READ - Obtener todas las prendas activas
   */
  async findAll(): Promise<PrendaEntity[]> {
    try {
      logCrudAction('info', 'Consultando todas las prendas activas');
      // Mantenimiento Preventivo: Enviar evento de QUERY
      this.eventManagerClient.sendQueryEvent('find-all');

      // Mantenimiento Correctivo: Solo traer prendas no eliminadas
      return await this.prendaRepository.find({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error obteniendo prendas: ${error}`);
      logCrudAction('error', `Error obteniendo todas las prendas: ${error instanceof Error ? error.message : 'Desconocido'}`);
      throw new InternalServerErrorException('Error al obtener prendas');
    } finally {
      logCrudAction('info', 'findAll() finalizado');
    }
  }

  /**
   * 🔵 READ - Obtener prenda por ID
   */
  async findById(id: string): Promise<PrendaEntity> {
    const sanitizedId = this.safeSanitizeId(id);
    try {
      const prenda = await this.prendaRepository.findOne({
        where: { id: sanitizedId, isDeleted: false },
      });

      if (!prenda) {
        logCrudAction('warn', `Prenda no encontrada por ID`, sanitizedId);
        throw new NotFoundException(`Prenda con ID ${sanitizedId} no encontrada`);
      }

      logCrudAction('info', `Prenda consultada por ID exitosamente`, sanitizedId);
      return prenda;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error obteniendo prenda: ${error}`);
      logCrudAction('error', `Error consultando prenda por ID: ${error instanceof Error ? error.message : 'Desconocido'}`, sanitizedId);
      throw new InternalServerErrorException('Error al obtener prenda');
    } finally {
      logCrudAction('info', 'findById() finalizado');
    }
  }

  /**
   * 🔵 READ - Buscar prendas por talla
   */
  async findBySize(size: string): Promise<PrendaEntity[]> {
    const sanitizedSize = this.safeSanitizeSize(size);
    try {
      logCrudAction('info', `Consultando prendas por talla: ${sanitizedSize}`);
      this.eventManagerClient.sendQueryEvent('find-by-size', { size: sanitizedSize });

      return await this.prendaRepository.find({
        where: { size: sanitizedSize, isDeleted: false },
        order: { name: 'ASC' },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error buscando por talla: ${error}`);
      logCrudAction('error', `Error buscando prendas por talla: ${error instanceof Error ? error.message : 'Desconocido'}`);
      throw new InternalServerErrorException('Error al buscar prendas por talla');
    } finally {
      logCrudAction('info', 'findBySize() finalizado');
    }
  }

  /**
   * 🔵 READ - Buscar prendas por nombre (LIKE)
   */
  async findByName(name: string): Promise<PrendaEntity[]> {
    const sanitizedName = this.safeSanitizeString(name, 'Nombre', 255);
    try {
      logCrudAction('info', `Consultando prendas por nombre: ${sanitizedName}`);
      this.eventManagerClient.sendQueryEvent('find-by-name', { name: sanitizedName });

      return await this.prendaRepository.find({
        where: { name: Like(`%${sanitizedName}%`), isDeleted: false },
        order: { name: 'ASC' },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error buscando por nombre: ${error}`);
      logCrudAction('error', `Error buscando prendas por nombre: ${error instanceof Error ? error.message : 'Desconocido'}`);
      throw new InternalServerErrorException('Error al buscar prendas por nombre');
    } finally {
      logCrudAction('info', 'findByName() finalizado');
    }
  }

  /**
   * 🟡 UPDATE - Actualizar prenda
   */
  async update(id: string, updatePrendaDto: UpdatePrendaDto): Promise<PrendaEntity> {
    const sanitizedId = this.safeSanitizeId(id);
    try {
      // Mantenimiento Correctivo: Verificar que prenda exista
      const prendaAntes = await this.findById(sanitizedId);

      const nameNorm = updatePrendaDto.name !== undefined
        ? this.safeSanitizeString(updatePrendaDto.name, 'Nombre', 255)
        : undefined;
      const sizeNorm = updatePrendaDto.size !== undefined
        ? this.safeSanitizeSize(updatePrendaDto.size)
        : undefined;
      const descriptionNorm = updatePrendaDto.description !== undefined
        ? this.safeSanitizeString(updatePrendaDto.description, 'Descripción', 1000, true)
        : undefined;
      const colorNorm = updatePrendaDto.color !== undefined
        ? this.safeSanitizeString(updatePrendaDto.color, 'Color', 100, true)
        : undefined;
      const materialNorm = updatePrendaDto.material !== undefined
        ? this.safeSanitizeString(updatePrendaDto.material, 'Material', 100, true)
        : undefined;
      const priceNorm = updatePrendaDto.price !== undefined
        ? this.safeSanitizeDecimal(updatePrendaDto.price, 'Precio')
        : undefined;
      const stockNorm = updatePrendaDto.stock !== undefined
        ? this.safeSanitizeInteger(updatePrendaDto.stock, 'Stock')
        : undefined;

      // Mantenimiento Correctivo: Validar que no haya duplicados si cambia nombre/talla
      if (
        (nameNorm !== undefined || sizeNorm !== undefined) &&
        (nameNorm !== prendaAntes.name || sizeNorm !== prendaAntes.size)
      ) {
        const checkName = nameNorm !== undefined ? nameNorm : prendaAntes.name;
        const checkSize = sizeNorm !== undefined ? sizeNorm : prendaAntes.size;
        
        const duplicada = await this.prendaRepository.findOne({
          where: {
            name: checkName,
            size: checkSize,
            isDeleted: false,
          },
        });

        if (duplicada && duplicada.id !== sanitizedId) {
          logCrudAction('warn', `Intento de actualización generaría duplicado de prenda`, sanitizedId);
          throw new BadRequestException('Ya existe una prenda con ese nombre y talla');
        }
      }

      // Mantenimiento Preventivo: Preparar cambios para auditoría
      const cambios: Record<string, any> = {};

      // Actualizar solo campos proporcionados
      if (nameNorm !== undefined && nameNorm !== prendaAntes.name) {
        prendaAntes.name = nameNorm;
        cambios['name'] = nameNorm;
      }

      if (
        updatePrendaDto.description !== undefined &&
        descriptionNorm !== prendaAntes.description
      ) {
        prendaAntes.description = descriptionNorm || null;
        cambios['description'] = descriptionNorm;
      }

      if (sizeNorm !== undefined && sizeNorm !== prendaAntes.size) {
        prendaAntes.size = sizeNorm;
        cambios['size'] = sizeNorm;
      }

      if (priceNorm !== undefined && priceNorm !== prendaAntes.price) {
        prendaAntes.price = priceNorm;
        cambios['price'] = priceNorm;
      }

      if (stockNorm !== undefined && stockNorm !== prendaAntes.stock) {
        prendaAntes.stock = stockNorm;
        cambios['stock'] = stockNorm;
      }

      if (colorNorm !== undefined && colorNorm !== prendaAntes.color) {
        prendaAntes.color = colorNorm || null;
        cambios['color'] = colorNorm;
      }

      if (
        materialNorm !== undefined &&
        materialNorm !== prendaAntes.material
      ) {
        prendaAntes.material = materialNorm || null;
        cambios['material'] = materialNorm;
      }

      // Si no hay cambios, retornar sin actualizar
      if (Object.keys(cambios).length === 0) {
        return prendaAntes;
      }

      // Guardar cambios
      const prendaActualizada = await this.prendaRepository.save(prendaAntes);

      // Mantenimiento Perfectivo: Enviar evento UPDATE con comparativa
      this.eventManagerClient.sendUpdateEvent(
        { ...prendaAntes, ...cambios },
        prendaActualizada,
        cambios
      );

      logCrudAction('info', `Prenda actualizada exitosamente`, prendaActualizada.id);
      return prendaActualizada;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error actualizando prenda: ${error}`);
      logCrudAction('error', `Error actualizando prenda: ${error instanceof Error ? error.message : 'Desconocido'}`, sanitizedId);
      throw new InternalServerErrorException(
        `Error al actualizar prenda: ${error instanceof Error ? error.message : 'Desconocido'}`
      );
    } finally {
      logCrudAction('info', 'update() finalizado');
    }
  }

  /**
   * 🔴 DELETE - Eliminar prenda (soft delete)
   * 
   * Mantenimiento Preventivo: Usar soft delete para mantener auditoría
   * No se elimina físicamente, solo se marca como eliminada
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    const sanitizedId = this.safeSanitizeId(id);
    try {
      // Mantenimiento Correctivo: Verificar que prenda exista
      const prenda = await this.findById(sanitizedId);

      // Marcar como eliminada (soft delete)
      prenda.isDeleted = true;
      await this.prendaRepository.save(prenda);

      // Mantenimiento Perfectivo: Enviar evento DELETE
      this.eventManagerClient.sendDeleteEvent(prenda);

      logCrudAction('info', `Prenda eliminada lógicamente (soft delete)`, prenda.id);

      return {
        message: `Prenda "${prenda.name}" eliminada exitosamente`,
        id: prenda.id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error eliminando prenda: ${error}`);
      logCrudAction('error', `Error eliminando prenda: ${error instanceof Error ? error.message : 'Desconocido'}`, sanitizedId);
      throw new InternalServerErrorException(
        `Error al eliminar prenda: ${error instanceof Error ? error.message : 'Desconocido'}`
      );
    } finally {
      logCrudAction('info', 'remove() finalizado');
    }
  }

  /**
   * PERFECTIVO: Obtener estadísticas del inventario
   */
  async getInventarioStats(): Promise<{
    totalPrendas: number;
    stockTotal: number;
    precioPromedio: number;
    prendaMasVendida?: string;
    distribucionPorTalla: Record<string, number>;
  }> {
    try {
      logCrudAction('info', `Consultando estadísticas de inventario`);
      const prendas = await this.prendaRepository.find({
        where: { isDeleted: false },
      });

      if (prendas.length === 0) {
        return {
          totalPrendas: 0,
          stockTotal: 0,
          precioPromedio: 0,
          distribucionPorTalla: {},
        };
      }

      // Contar por talla
      const distribucionPorTalla: Record<string, number> = {
        XS: 0,
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0,
      };

      prendas.forEach((p) => {
        if (distribucionPorTalla[p.size] !== undefined) {
          distribucionPorTalla[p.size]++;
        }
      });

      // Mantenimiento Correctivo: Validar null pointers y convertir precios correctamente
      let totalStock = 0;
      let sumaPrecios = 0;
      let contadorPrecios = 0;

      for (const prenda of prendas) {
        // Validar que stock no sea null/undefined
        if (prenda.stock != null && typeof prenda.stock === 'number' && prenda.stock >= 0) {
          totalStock += prenda.stock;
        } else if (prenda.stock != null) {
          this.logger.warn(`⚠️ Stock inválido en prenda ${prenda.id}: ${prenda.stock}`);
        }

        // Validar que price no sea null/undefined
        if (prenda.price != null) {
          const precioNumero = typeof prenda.price === 'number'
            ? prenda.price
            : parseFloat(String(prenda.price));
          
          if (!isNaN(precioNumero) && precioNumero >= 0) {
            sumaPrecios += precioNumero;
            contadorPrecios++;
          } else {
            this.logger.warn(`⚠️ Precio inválido en prenda ${prenda.id}: ${prenda.price}`);
          }
        }
      }

      // Calcular promedio de forma segura
      const precioPromedio = contadorPrecios > 0
        ? Math.round((sumaPrecios / contadorPrecios) * 100) / 100
        : 0;

      return {
        totalPrendas: prendas.length,
        stockTotal: totalStock,
        precioPromedio: precioPromedio,
        distribucionPorTalla,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas: ${error}`);
      logCrudAction('error', `Error obteniendo estadísticas: ${error instanceof Error ? error.message : 'Desconocido'}`);
      throw new InternalServerErrorException('Error al obtener estadísticas');
    } finally {
      logCrudAction('info', 'getInventarioStats() finalizado');
    }
  }
}
