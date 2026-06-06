/**
 * CONTROLADOR - Prendas CRUD
 * 
 * Mantenimiento Perfectivo:
 * - Logging automático via interceptor (sin try-catch repetitivos)
 * - Documentación Swagger/OpenAPI completa
 * - Métodos simples y enfocados
 * - Validaciones delegadas al servicio
 * 
 * Endpoints:
 * POST   /prendas                  - Crear prenda
 * GET    /prendas                  - Obtener todas las prendas
 * GET    /prendas/:id              - Obtener prenda por ID
 * GET    /prendas/size/:size       - Buscar por talla
 * GET    /prendas/search/:name     - Buscar por nombre
 * PATCH  /prendas/:id              - Actualizar prenda
 * DELETE /prendas/:id              - Eliminar prenda
 * GET    /prendas/stats/inventario - Obtener estadísticas
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { PrendasService } from '../services/prendas.service';
import { CreatePrendaDto } from '../dto/create-prenda.dto';
import { UpdatePrendaDto } from '../dto/update-prenda.dto';
import { PrendaEntity } from '../entities/prenda.entity';
import { LoggingInterceptor } from '../../../common/interceptors/logging.interceptor';

@Controller('prendas')
@ApiTags('Prendas (Ropa)')
@ApiSecurity('X-FIS-EPN-KEY')
@UseInterceptors(LoggingInterceptor)
export class PrendasController {
  constructor(private readonly prendasService: PrendasService) {}

  /**
   * 🟢 POST /prendas - Crear nueva prenda
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva prenda',
    description:
      'Crea una nueva prenda en el inventario. Valida que no exista duplicada con mismo nombre y talla.',
  })
  @ApiBody({
    description: 'Datos de la prenda a crear',
    type: CreatePrendaDto,
    examples: {
      camiseta: {
        summary: 'Crear camiseta',
        value: {
          name: 'Camiseta Básica',
          size: 'M',
          price: 29.99,
          stock: 50,
          color: 'Negro',
          material: 'Algodón 100%',
          description: 'Camiseta casual de algodón',
        },
      },
      pantalon: {
        summary: 'Crear pantalón',
        value: {
          name: 'Pantalón Denim',
          size: 'L',
          price: 79.99,
          stock: 30,
          color: 'Azul',
          material: 'Denim',
          description: 'Pantalón ajustado',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Prenda creada exitosamente',
    type: PrendaEntity,
  })
  @ApiBadRequestResponse({
    description:
      'Error de validación (duplicado, datos inválidos, etc.)',
    schema: {
      example: {
        statusCode: 400,
        message: 'Ya existe una prenda "Camiseta" en talla M',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error al validar duplicados o guardar en BD',
  })
  async create(@Body() createPrendaDto: CreatePrendaDto): Promise<PrendaEntity> {
    return this.prendasService.create(createPrendaDto);
  }

  /**
   * 🔵 GET /prendas - Obtener todas las prendas activas
   */
  @Get()
  @ApiOperation({
    summary: 'Obtener todas las prendas',
    description: 'Retorna todas las prendas activas (no eliminadas), ordenadas por fecha de creación (más recientes primero).',
  })
  @ApiOkResponse({
    description: 'Lista de todas las prendas',
    type: [PrendaEntity],
  })
  @ApiInternalServerErrorResponse({
    description: 'Error al obtener prendas de la base de datos',
  })
  async findAll(): Promise<PrendaEntity[]> {
    return this.prendasService.findAll();
  }

  /**
   * 🔵 GET /prendas/:id - Obtener prenda específica
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener prenda por ID',
    description: 'Retorna los datos detallados de una prenda específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la prenda',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Prenda encontrada',
    type: PrendaEntity,
  })
  @ApiNotFoundResponse({
    description: 'Prenda con ese ID no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Prenda con ID 550e8400-e29b-41d4-a716-446655440000 no encontrada',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'ID inválido',
  })
  async findById(@Param('id') id: string): Promise<PrendaEntity> {
    return this.prendasService.findById(id);
  }

  /**
   * 🔵 GET /prendas/size/:size - Buscar por talla
   */
  @Get('size/:size')
  @ApiOperation({
    summary: 'Buscar prendas por talla',
    description:
      'Retorna todas las prendas con la talla especificada. Tallas válidas: XS, S, M, L, XL, XXL',
  })
  @ApiParam({
    name: 'size',
    description: 'Talla de la prenda',
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    example: 'M',
  })
  @ApiOkResponse({
    description: 'Prendas encontradas con esa talla',
    type: [PrendaEntity],
  })
  @ApiBadRequestResponse({
    description: 'Talla inválida',
  })
  async findBySize(@Param('size') size: string): Promise<PrendaEntity[]> {
    return this.prendasService.findBySize(size);
  }

  /**
   * 🔵 GET /prendas/search/:name - Buscar por nombre (búsqueda parcial)
   */
  @Get('search/:name')
  @ApiOperation({
    summary: 'Buscar prendas por nombre',
    description:
      'Retorna todas las prendas cuyo nombre contiene el texto especificado (búsqueda case-insensitive).',
  })
  @ApiParam({
    name: 'name',
    description: 'Nombre o parte del nombre de la prenda',
    example: 'Camiseta',
  })
  @ApiOkResponse({
    description: 'Prendas encontradas',
    type: [PrendaEntity],
  })
  @ApiBadRequestResponse({
    description: 'Nombre inválido',
  })
  async findByName(@Param('name') name: string): Promise<PrendaEntity[]> {
    return this.prendasService.findByName(name);
  }

  /**
   * 🟡 PATCH /prendas/:id - Actualizar prenda (actualización parcial)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar prenda',
    description:
      'Actualiza uno o más campos de una prenda. Solo actualiza los campos proporcionados. Todos los campos son opcionales.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la prenda a actualizar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    description: 'Campos a actualizar (todos opcionales)',
    type: UpdatePrendaDto,
    examples: {
      updatePrice: {
        summary: 'Actualizar solo precio',
        value: { price: 39.99 },
      },
      updateMultiple: {
        summary: 'Actualizar múltiples campos',
        value: {
          price: 34.99,
          stock: 45,
          color: 'Rojo',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Prenda actualizada',
    type: PrendaEntity,
  })
  @ApiBadRequestResponse({
    description: 'Error de validación (duplicado, datos inválidos, etc.)',
  })
  @ApiNotFoundResponse({
    description: 'Prenda con ese ID no encontrada',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePrendaDto: UpdatePrendaDto,
  ): Promise<PrendaEntity> {
    return this.prendasService.update(id, updatePrendaDto);
  }

  /**
   * 🔴 DELETE /prendas/:id - Eliminar prenda (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar prenda',
    description:
      'Realiza un "soft delete" - marca la prenda como eliminada pero conserva los datos en la base de datos para auditoría.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la prenda a eliminar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Prenda eliminada exitosamente',
    schema: {
      example: {
        message: 'Prenda "Camiseta" eliminada exitosamente',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Prenda con ese ID no encontrada',
  })
  @ApiBadRequestResponse({
    description: 'ID inválido',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ message: string; id: string }> {
    return this.prendasService.remove(id);
  }

  /**
   * 📊 GET /prendas/stats/inventario - Estadísticas del inventario
   */
  @Get('stats/inventario')
  @ApiOperation({
    summary: 'Obtener estadísticas del inventario',
    description:
      'Retorna estadísticas agregadas: total de prendas, stock total, precio promedio y distribución por talla.',
  })
  @ApiOkResponse({
    description: 'Estadísticas del inventario',
    schema: {
      example: {
        totalPrendas: 15,
        stockTotal: 350,
        precioPromedio: 45.5,
        distribucionPorTalla: {
          XS: 0,
          S: 2,
          M: 5,
          L: 6,
          XL: 2,
          XXL: 0,
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error al calcular estadísticas',
  })
  async getInventarioStats(): Promise<{
    totalPrendas: number;
    stockTotal: number;
    precioPromedio: number;
    distribucionPorTalla: Record<string, number>;
  }> {
    return this.prendasService.getInventarioStats();
  }
}
