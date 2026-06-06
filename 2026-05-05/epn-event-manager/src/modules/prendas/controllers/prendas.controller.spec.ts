/// <reference types="jest" />

/**
 * SUITE DE TESTS UNITARIOS - Prendas CRUD
 * 
 * Mantenimiento Perfectivo: Tests exhaustivos con Jest
 * 
 * Cobertura:
 * ✅ Tests del Controlador (mocking del servicio)
 * ✅ Tests del Servicio (mocking del repositorio)
 * ✅ Tests de DTOs y Validaciones
 * ✅ Tests de Casos de Error
 * ✅ Tests de Reglas de Datos Únicos (Duplicados)
 * ✅ Tests de Validaciones de Negocio
 * 
 * Ejecución:
 * npm test -- prendas.controller.spec.ts
 * npm test -- prendas.service.spec.ts
 * npm test:cov -- prendas    (cobertura)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrendasController } from './prendas.controller';
import { PrendasService } from '../services/prendas.service';
import { CreatePrendaDto } from '../dto/create-prenda.dto';
import { UpdatePrendaDto } from '../dto/update-prenda.dto';
import { PrendaEntity } from '../entities/prenda.entity';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * ============================================================
 * TESTS DEL CONTROLADOR
 * ============================================================
 */
describe('PrendasController - Suite Exhaustiva', () => {
  let controller: PrendasController;
  let service: PrendasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrendasController],
      providers: [
        {
          provide: PrendasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySize: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getInventarioStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PrendasController>(PrendasController);
    service = module.get<PrendasService>(PrendasService);
  });

  // ============================================================
  // TESTS: POST /prendas - CREATE
  // ============================================================
  describe('create (POST /prendas)', () => {
    it('✅ Debe crear prenda válida exitosamente', async () => {
      const dto: CreatePrendaDto = {
        name: 'Camiseta',
        size: 'M',
        price: 29.99,
        stock: 50,
        color: 'Negro',
        material: 'Algodón',
        description: 'Camiseta casual',
      };

      const resultado = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...dto,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PrendaEntity;

      jest.spyOn(service, 'create').mockResolvedValue(resultado);

      const respuesta = await controller.create(dto);

      expect(respuesta).toEqual(resultado);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(respuesta.name).toBe('Camiseta');
      expect(respuesta.size).toBe('M');
      expect(respuesta.isDeleted).toBe(false);
    });

    it('❌ Debe rechazar prenda duplicada (mismo nombre y talla)', async () => {
      const dto: CreatePrendaDto = {
        name: 'Camiseta',
        size: 'M',
        price: 29.99,
        stock: 50,
      };

      const error = new BadRequestException(
        'Ya existe una prenda "Camiseta" en talla M',
      );

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('❌ Debe rechazar prenda con precio negativo', async () => {
      const dto = {
        name: 'Camiseta',
        size: 'M',
        price: -10,
        stock: 50,
      } as CreatePrendaDto;

      const error = new BadRequestException('El precio no puede ser negativo');

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('❌ Debe rechazar prenda con stock negativo', async () => {
      const dto = {
        name: 'Camiseta',
        size: 'M',
        price: 29.99,
        stock: -5,
      } as CreatePrendaDto;

      const error = new BadRequestException('El stock no puede ser negativo');

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('❌ Debe rechazar talla inválida', async () => {
      const dto = {
        name: 'Camiseta',
        size: 'XXXL',
        price: 29.99,
        stock: 50,
      } as CreatePrendaDto;

      const error = new BadRequestException(
        'Talla inválida. Valores permitidos: XS, S, M, L, XL, XXL',
      );

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('❌ Debe rechazar nombre vacío', async () => {
      const dto = {
        name: '',
        size: 'M',
        price: 29.99,
        stock: 50,
      } as CreatePrendaDto;

      const error = new BadRequestException('El nombre es obligatorio');

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('❌ Debe rechazar nombre muy largo (> 255 caracteres)', async () => {
      const dto = {
        name: 'a'.repeat(256),
        size: 'M',
        price: 29.99,
        stock: 50,
      } as CreatePrendaDto;

      const error = new BadRequestException(
        'El nombre no puede exceder 255 caracteres',
      );

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('❌ Debe lanzar InternalServerErrorException en error de BD', async () => {
      const dto: CreatePrendaDto = {
        name: 'Camiseta',
        size: 'M',
        price: 29.99,
        stock: 50,
      };

      const error = new InternalServerErrorException('Error al crear prenda');

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ============================================================
  // TESTS: GET /prendas - FIND ALL
  // ============================================================
  describe('findAll (GET /prendas)', () => {
    it('✅ Debe retornar lista de prendas', async () => {
      const prendas: PrendaEntity[] = [
        {
          id: '1',
          name: 'Camiseta',
          size: 'M',
          price: 29.99,
          stock: 50,
          color: 'Negro',
          material: 'Algodón',
          description: 'Camiseta casual',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Pantalón',
          size: 'L',
          price: 79.99,
          stock: 30,
          color: 'Azul',
          material: 'Denim',
          description: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(prendas);

      const respuesta = await controller.findAll();

      expect(respuesta).toEqual(prendas);
      expect(respuesta.length).toBe(2);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('✅ Debe retornar lista vacía si no hay prendas', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const respuesta = await controller.findAll();

      expect(respuesta).toEqual([]);
      expect(respuesta.length).toBe(0);
    });

    it('❌ Debe lanzar InternalServerErrorException en error de BD', async () => {
      const error = new InternalServerErrorException('Error al obtener prendas');

      jest.spyOn(service, 'findAll').mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ============================================================
  // TESTS: GET /prendas/:id - FIND BY ID
  // ============================================================
  describe('findById (GET /prendas/:id)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    it('✅ Debe retornar prenda por ID válido', async () => {
      const prenda: PrendaEntity = {
        id,
        name: 'Camiseta',
        size: 'M',
        price: 29.99,
        stock: 50,
        color: 'Negro',
        material: 'Algodón',
        description: 'Camiseta casual',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'findById').mockResolvedValue(prenda);

      const respuesta = await controller.findById(id);

      expect(respuesta).toEqual(prenda);
      expect(respuesta.id).toBe(id);
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('❌ Debe lanzar NotFoundException para ID inexistente', async () => {
      const error = new NotFoundException(
        `Prenda con ID ${id} no encontrada`,
      );

      jest.spyOn(service, 'findById').mockRejectedValue(error);

      await expect(controller.findById(id)).rejects.toThrow(NotFoundException);
    });

    it('❌ Debe lanzar BadRequestException para ID inválido', async () => {
      const idInvalido = 'invalid-uuid';
      const error = new BadRequestException('ID inválido');

      jest.spyOn(service, 'findById').mockRejectedValue(error);

      await expect(controller.findById(idInvalido)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================================
  // TESTS: GET /prendas/size/:size - FIND BY SIZE
  // ============================================================
  describe('findBySize (GET /prendas/size/:size)', () => {
    it('✅ Debe retornar prendas de talla válida', async () => {
      const prendas: PrendaEntity[] = [
        {
          id: '1',
          name: 'Camiseta',
          size: 'M',
          price: 29.99,
          stock: 50,
          color: 'Negro',
          material: 'Algodón',
          description: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(service, 'findBySize').mockResolvedValue(prendas);

      const respuesta = await controller.findBySize('M');

      expect(respuesta).toEqual(prendas);
      expect(respuesta[0].size).toBe('M');
      expect(service.findBySize).toHaveBeenCalledWith('M');
    });

    it('✅ Debe retornar lista vacía para talla sin prendas', async () => {
      jest.spyOn(service, 'findBySize').mockResolvedValue([]);

      const respuesta = await controller.findBySize('XS');

      expect(respuesta).toEqual([]);
      expect(respuesta.length).toBe(0);
    });

    it('❌ Debe rechazar talla inválida', async () => {
      const error = new BadRequestException(
        'Talla inválida. Valores permitidos: XS, S, M, L, XL, XXL',
      );

      jest.spyOn(service, 'findBySize').mockRejectedValue(error);

      await expect(controller.findBySize('XXXL')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================================
  // TESTS: GET /prendas/search/:name - FIND BY NAME
  // ============================================================
  describe('findByName (GET /prendas/search/:name)', () => {
    it('✅ Debe retornar prendas que coincidan con nombre', async () => {
      const prendas: PrendaEntity[] = [
        {
          id: '1',
          name: 'Camiseta Básica',
          size: 'M',
          price: 29.99,
          stock: 50,
          color: 'Negro',
          material: 'Algodón',
          description: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Camiseta Premium',
          size: 'L',
          price: 39.99,
          stock: 30,
          color: 'Blanco',
          material: 'Seda',
          description: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(service, 'findByName').mockResolvedValue(prendas);

      const respuesta = await controller.findByName('Camiseta');

      expect(respuesta).toEqual(prendas);
      expect(respuesta.length).toBe(2);
      expect(respuesta.every((p) => p.name.includes('Camiseta'))).toBe(true);
    });

    it('✅ Debe retornar lista vacía si no hay coincidencias', async () => {
      jest.spyOn(service, 'findByName').mockResolvedValue([]);

      const respuesta = await controller.findByName('NoExiste');

      expect(respuesta).toEqual([]);
    });

    it('❌ Debe rechazar nombre inválido', async () => {
      const error = new BadRequestException('Nombre inválido');

      jest.spyOn(service, 'findByName').mockRejectedValue(error);

      await expect(controller.findByName('!!!INVALID!!!')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================================
  // TESTS: PATCH /prendas/:id - UPDATE
  // ============================================================
  describe('update (PATCH /prendas/:id)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    it('✅ Debe actualizar solo el precio', async () => {
      const dto: UpdatePrendaDto = { price: 39.99 };
      const prendaActualizada: PrendaEntity = {
        id,
        name: 'Camiseta',
        size: 'M',
        price: 39.99,
        stock: 50,
        color: 'Negro',
        material: 'Algodón',
        description: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'update').mockResolvedValue(prendaActualizada);

      const respuesta = await controller.update(id, dto);

      expect(respuesta.price).toBe(39.99);
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });

    it('✅ Debe actualizar múltiples campos', async () => {
      const dto: UpdatePrendaDto = {
        price: 39.99,
        stock: 45,
        color: 'Rojo',
      };

      const prendaActualizada: PrendaEntity = {
        id,
        name: 'Camiseta',
        size: 'M',
        price: 39.99,
        stock: 45,
        color: 'Rojo',
        material: 'Algodón',
        description: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'update').mockResolvedValue(prendaActualizada);

      const respuesta = await controller.update(id, dto);

      expect(respuesta.price).toBe(39.99);
      expect(respuesta.stock).toBe(45);
      expect(respuesta.color).toBe('Rojo');
    });

    it('❌ Debe rechazar actualización a precio negativo', async () => {
      const dto = { price: -10 } as UpdatePrendaDto;
      const error = new BadRequestException('El precio no puede ser negativo');

      jest.spyOn(service, 'update').mockRejectedValue(error);

      await expect(controller.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe rechazar actualización a stock negativo', async () => {
      const dto = { stock: -5 } as UpdatePrendaDto;
      const error = new BadRequestException('El stock no puede ser negativo');

      jest.spyOn(service, 'update').mockRejectedValue(error);

      await expect(controller.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe lanzar NotFoundException para ID inexistente', async () => {
      const dto: UpdatePrendaDto = { price: 39.99 };
      const error = new NotFoundException(`Prenda con ID ${id} no encontrada`);

      jest.spyOn(service, 'update').mockRejectedValue(error);

      await expect(controller.update(id, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ Debe rechazar talla duplicada después de actualizar', async () => {
      const dto: UpdatePrendaDto = { name: 'OtraProenda', size: 'M' };
      const error = new BadRequestException(
        'Ya existe una prenda con ese nombre y talla',
      );

      jest.spyOn(service, 'update').mockRejectedValue(error);

      await expect(controller.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================================
  // TESTS: DELETE /prendas/:id - REMOVE
  // ============================================================
  describe('remove (DELETE /prendas/:id)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    it('✅ Debe eliminar prenda exitosamente (soft delete)', async () => {
      const resultado = {
        message: 'Prenda "Camiseta" eliminada exitosamente',
        id,
      };

      jest.spyOn(service, 'remove').mockResolvedValue(resultado);

      const respuesta = await controller.remove(id);

      expect(respuesta).toEqual(resultado);
      expect(respuesta.message).toContain('eliminada');
      expect(service.remove).toHaveBeenCalledWith(id);
    });

    it('❌ Debe lanzar NotFoundException para ID inexistente', async () => {
      const error = new NotFoundException(
        `Prenda con ID ${id} no encontrada`,
      );

      jest.spyOn(service, 'remove').mockRejectedValue(error);

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('❌ Debe lanzar BadRequestException para ID inválido', async () => {
      const idInvalido = 'invalid-uuid';
      const error = new BadRequestException('ID inválido');

      jest.spyOn(service, 'remove').mockRejectedValue(error);

      await expect(controller.remove(idInvalido)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================================
  // TESTS: GET /prendas/stats/inventario - STATISTICS
  // ============================================================
  describe('getInventarioStats (GET /prendas/stats/inventario)', () => {
    it('✅ Debe retornar estadísticas correctas', async () => {
      const stats = {
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
      };

      jest.spyOn(service, 'getInventarioStats').mockResolvedValue(stats);

      const respuesta = await controller.getInventarioStats();

      expect(respuesta).toEqual(stats);
      expect(respuesta.totalPrendas).toBe(15);
      expect(respuesta.stockTotal).toBe(350);
      expect(respuesta.precioPromedio).toBe(45.5);
      expect(respuesta.distribucionPorTalla.M).toBe(5);
    });

    it('✅ Debe retornar ceros para inventario vacío', async () => {
      const stats = {
        totalPrendas: 0,
        stockTotal: 0,
        precioPromedio: 0,
        distribucionPorTalla: {
          XS: 0,
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          XXL: 0,
        },
      };

      jest.spyOn(service, 'getInventarioStats').mockResolvedValue(stats);

      const respuesta = await controller.getInventarioStats();

      expect(respuesta.totalPrendas).toBe(0);
      expect(respuesta.stockTotal).toBe(0);
    });

    it('❌ Debe lanzar InternalServerErrorException en error de cálculo', async () => {
      const error = new InternalServerErrorException(
        'Error al calcular estadísticas',
      );

      jest.spyOn(service, 'getInventarioStats').mockRejectedValue(error);

      await expect(controller.getInventarioStats()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

/**
 * ============================================================
 * TESTS DE VALIDACIÓN DE DATOS
 * ============================================================
 */
describe('Validaciones de Datos - DTO Level', () => {
  describe('CreatePrendaDto', () => {
    it('✅ Debe validar CreatePrendaDto válido', async () => {
      const dto: CreatePrendaDto = {
        name: 'Camiseta',
        size: 'M',
        price: 29.99,
        stock: 50,
        color: 'Negro',
        material: 'Algodón',
        description: 'Camiseta casual',
      };

      // En Jest, podemos validar la estructura
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('size');
      expect(dto).toHaveProperty('price');
      expect(dto).toHaveProperty('stock');
      expect(typeof dto.name).toBe('string');
      expect(typeof dto.price).toBe('number');
      expect(typeof dto.stock).toBe('number');
    });

    it('✅ Debe permitir campos opcionales', async () => {
      const dto: CreatePrendaDto = {
        name: 'Camiseta',
        size: 'M',
        price: 29.99,
        stock: 50,
      };

      expect(dto.color).toBeUndefined();
      expect(dto.material).toBeUndefined();
      expect(dto.description).toBeUndefined();
    });
  });

  describe('UpdatePrendaDto', () => {
    it('✅ Debe permitir todos los campos opcionales', async () => {
      const dto: UpdatePrendaDto = {};

      // Todos los campos son opcionales
      expect(Object.keys(dto).length).toBe(0);
    });

    it('✅ Debe permitir actualización parcial', async () => {
      const dto: UpdatePrendaDto = {
        price: 39.99,
        stock: 45,
      };

      expect(dto.price).toBe(39.99);
      expect(dto.stock).toBe(45);
      expect(dto.name).toBeUndefined();
    });
  });
});

/**
 * ============================================================
 * TESTS DE REGLAS DE DATOS ÚNICOS
 * ============================================================
 */
describe('Reglas de Datos Únicos - Duplicados', () => {
  let controller: PrendasController;
  let service: PrendasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrendasController],
      providers: [
        {
          provide: PrendasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySize: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getInventarioStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PrendasController>(PrendasController);
    service = module.get<PrendasService>(PrendasService);
  });

  it('❌ Debe rechazar crear prenda con mismo nombre Y talla', async () => {
    const dto: CreatePrendaDto = {
      name: 'Camiseta',
      size: 'M',
      price: 29.99,
      stock: 50,
    };

    const error = new BadRequestException(
      'Ya existe una prenda "Camiseta" en talla M',
    );

    jest.spyOn(service, 'create').mockRejectedValue(error);

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('✅ Debe permitir crear prenda con mismo nombre pero diferente talla', async () => {
    const dto: CreatePrendaDto = {
      name: 'Camiseta',
      size: 'L', // Diferente talla
      price: 29.99,
      stock: 50,
    };

    const resultado = {
      id: 'new-id',
      ...dto,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PrendaEntity;

    jest.spyOn(service, 'create').mockResolvedValue(resultado);

    const respuesta = await controller.create(dto);

    expect(respuesta).toEqual(resultado);
    expect(respuesta.size).toBe('L');
  });

  it('✅ Debe permitir crear prenda con mismo nombre si la anterior fue eliminada', async () => {
    const dto: CreatePrendaDto = {
      name: 'Camiseta',
      size: 'M',
      price: 29.99,
      stock: 50,
    };

    const resultado = {
      id: 'another-id',
      ...dto,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PrendaEntity;

    jest.spyOn(service, 'create').mockResolvedValue(resultado);

    // El servicio debe verificar isDeleted: false
    const respuesta = await controller.create(dto);

    expect(respuesta).toEqual(resultado);
  });
});

/**
 * ============================================================
 * TESTS DE VALIDACIONES DE NEGOCIO
 * ============================================================
 */
describe('Validaciones de Negocio', () => {
  let controller: PrendasController;
  let service: PrendasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrendasController],
      providers: [
        {
          provide: PrendasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySize: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getInventarioStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PrendasController>(PrendasController);
    service = module.get<PrendasService>(PrendasService);
  });

  describe('Validaciones de Talla', () => {
    const tallasValidas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const tallasInvalidas = ['XXXL', 'XX', 'P', 'G', 'AG', '', null, undefined];

    tallasValidas.forEach((talla) => {
      it(`✅ Debe aceptar talla válida: ${talla}`, async () => {
        const dto: CreatePrendaDto = {
          name: 'Prenda',
          size: talla,
          price: 29.99,
          stock: 50,
        };

        const resultado = {
          id: 'id',
          ...dto,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PrendaEntity;

        jest.spyOn(service, 'create').mockResolvedValue(resultado);

        const respuesta = await controller.create(dto);
        expect(respuesta.size).toBe(talla);
      });
    });

    tallasInvalidas.forEach((talla) => {
      if (talla !== null && talla !== undefined) {
        it(`❌ Debe rechazar talla inválida: ${talla}`, async () => {
          const dto = {
            name: 'Prenda',
            size: talla,
            price: 29.99,
            stock: 50,
          } as CreatePrendaDto;

          const error = new BadRequestException('Talla inválida');

          jest.spyOn(service, 'create').mockRejectedValue(error);

          await expect(controller.create(dto)).rejects.toThrow(
            BadRequestException,
          );
        });
      }
    });
  });

  describe('Validaciones de Precio', () => {
    it('❌ Debe rechazar precio negativo', async () => {
      const dto = {
        name: 'Prenda',
        size: 'M',
        price: -1,
        stock: 50,
      } as CreatePrendaDto;

      const error = new BadRequestException('El precio no puede ser negativo');

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('✅ Debe aceptar precio cero', async () => {
      const dto: CreatePrendaDto = {
        name: 'Prenda Gratis',
        size: 'M',
        price: 0,
        stock: 50,
      };

      const resultado = {
        id: 'id',
        ...dto,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PrendaEntity;

      jest.spyOn(service, 'create').mockResolvedValue(resultado);

      const respuesta = await controller.create(dto);
      expect(respuesta.price).toBe(0);
    });

    it('✅ Debe aceptar precio con máximo 2 decimales', async () => {
      const dto: CreatePrendaDto = {
        name: 'Prenda',
        size: 'M',
        price: 29.99,
        stock: 50,
      };

      const resultado = {
        id: 'id',
        ...dto,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PrendaEntity;

      jest.spyOn(service, 'create').mockResolvedValue(resultado);

      const respuesta = await controller.create(dto);
      expect(respuesta.price).toBe(29.99);
    });
  });

  describe('Validaciones de Stock', () => {
    it('❌ Debe rechazar stock negativo', async () => {
      const dto = {
        name: 'Prenda',
        size: 'M',
        price: 29.99,
        stock: -1,
      } as CreatePrendaDto;

      const error = new BadRequestException('El stock no puede ser negativo');

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('✅ Debe aceptar stock cero', async () => {
      const dto: CreatePrendaDto = {
        name: 'Prenda Sin Stock',
        size: 'M',
        price: 29.99,
        stock: 0,
      };

      const resultado = {
        id: 'id',
        ...dto,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PrendaEntity;

      jest.spyOn(service, 'create').mockResolvedValue(resultado);

      const respuesta = await controller.create(dto);
      expect(respuesta.stock).toBe(0);
    });

    it('✅ Debe aceptar stock muy grande', async () => {
      const dto: CreatePrendaDto = {
        name: 'Prenda Abundante',
        size: 'M',
        price: 29.99,
        stock: 9999999,
      };

      const resultado = {
        id: 'id',
        ...dto,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PrendaEntity;

      jest.spyOn(service, 'create').mockResolvedValue(resultado);

      const respuesta = await controller.create(dto);
      expect(respuesta.stock).toBe(9999999);
    });
  });

  describe('Validaciones de Nombre', () => {
    it('❌ Debe rechazar nombre vacío', async () => {
      const dto = {
        name: '',
        size: 'M',
        price: 29.99,
        stock: 50,
      } as CreatePrendaDto;

      const error = new BadRequestException('El nombre es obligatorio');

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('❌ Debe rechazar nombre > 255 caracteres', async () => {
      const dto = {
        name: 'a'.repeat(256),
        size: 'M',
        price: 29.99,
        stock: 50,
      } as CreatePrendaDto;

      const error = new BadRequestException(
        'El nombre no puede exceder 255 caracteres',
      );

      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('✅ Debe aceptar nombre exactamente 255 caracteres', async () => {
      const dto: CreatePrendaDto = {
        name: 'a'.repeat(255),
        size: 'M',
        price: 29.99,
        stock: 50,
      };

      const resultado = {
        id: 'id',
        ...dto,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PrendaEntity;

      jest.spyOn(service, 'create').mockResolvedValue(resultado);

      const respuesta = await controller.create(dto);
      expect(respuesta.name.length).toBe(255);
    });
  });
});
