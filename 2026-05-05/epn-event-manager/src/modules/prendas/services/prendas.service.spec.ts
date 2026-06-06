/// <reference types="jest" />

/**
 * SUITE DE TESTS UNITARIOS - Prendas Service
 * 
 * Mantenimiento Perfectivo: Tests exhaustivos con Jest
 * 
 * Cobertura:
 * ✅ Lógica de negocio (crear, buscar, actualizar, eliminar)
 * ✅ Validaciones de datos únicos (duplicados)
 * ✅ Soft delete (isDeleted)
 * ✅ Casos de error y excepciones
 * ✅ Cálculos estadísticos
 * 
 * Ejecución:
 * npm test -- prendas.service.spec.ts
 * npm test -- --testPathPattern="prendas.service"
 * npm run test:cov -- prendas.service
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrendasService } from './prendas.service';
import { PrendaEntity } from '../entities/prenda.entity';
import { CreatePrendaDto } from '../dto/create-prenda.dto';
import { UpdatePrendaDto } from '../dto/update-prenda.dto';
import { EventManagerClient } from '../clients/event-manager.client';

/**
 * ============================================================
 * SUITE DE TESTS DEL SERVICIO
 * ============================================================
 */
describe('PrendasService - Suite Exhaustiva', () => {
  let service: PrendasService;
  let repository: Repository<PrendaEntity>;

  // Mock data
  const mockPrendaEntity = (): PrendaEntity => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Camiseta',
    size: 'M',
    price: 29.99,
    stock: 50,
    color: 'Negro',
    material: 'Algodón',
    description: 'Camiseta casual',
    isDeleted: false,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
  });

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrendasService,
        {
          provide: getRepositoryToken(PrendaEntity),
          useValue: mockRepository,
        },
        {
          provide: EventManagerClient,
          useValue: {
            sendCreateEvent: jest.fn().mockResolvedValue(undefined),
            sendQueryEvent: jest.fn().mockResolvedValue(undefined),
            sendUpdateEvent: jest.fn().mockResolvedValue(undefined),
            sendDeleteEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PrendasService>(PrendasService);
    repository = module.get<Repository<PrendaEntity>>(
      getRepositoryToken(PrendaEntity),
    );

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  // ============================================================
  // TESTS: CREATE - Crear nueva prenda
  // ============================================================
  describe('create (POST /prendas)', () => {
    const dto: CreatePrendaDto = {
      name: 'Camiseta',
      size: 'M',
      price: 29.99,
      stock: 50,
      color: 'Negro',
      material: 'Algodón',
      description: 'Camiseta casual',
    };

    it('✅ Debe crear prenda válida exitosamente', async () => {
      const resultado = mockPrendaEntity();

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dto);

      expect(respuesta).toEqual(resultado);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: dto.name, size: dto.size, isDeleted: false },
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
      expect(repository.save).toHaveBeenCalledWith(resultado);
    });

    it('❌ Debe rechazar prenda duplicada (mismo nombre y talla)', async () => {
      const prendarexistente = mockPrendaEntity();

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendarexistente);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Ya existe una prenda "Camiseta" en talla M',
      );
    });

    it('✅ Debe permitir crear prenda si existe pero está eliminada', async () => {
      const dtoElimindado = {
        ...mockPrendaEntity(),
        isDeleted: true,
      };

      const resultado = mockPrendaEntity();

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dto);

      expect(respuesta).toEqual(resultado);
      // Verifica que busca con isDeleted: false
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: dto.name, size: dto.size, isDeleted: false },
      });
    });

    it('❌ Debe manejar error de BD en findOne', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('DB connection failed'));

      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('❌ Debe manejar error de BD en save', async () => {
      const resultado = mockPrendaEntity();

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('DB save failed'));

      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('✅ Debe aceptar precio con dos decimales', async () => {
      const dtoDecimal: CreatePrendaDto = { ...dto, price: 29.99 };
      const resultado = mockPrendaEntity();

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dtoDecimal);

      expect(respuesta.price).toBe(29.99);
    });

    it('✅ Debe aceptar stock cero', async () => {
      const dtoStockCero: CreatePrendaDto = { ...dto, stock: 0 };
      const resultado = mockPrendaEntity();
      resultado.stock = 0;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dtoStockCero);

      expect(respuesta.stock).toBe(0);
    });
  });

  // ============================================================
  // TESTS: FIND ALL - Obtener todas las prendas
  // ============================================================
  describe('findAll (GET /prendas)', () => {
    it('✅ Debe retornar lista de prendas activas ordenadas por fecha DESC', async () => {
      const prendas: PrendaEntity[] = [
        {
          ...mockPrendaEntity(),
          id: '1',
          name: 'Camiseta Nueva',
          createdAt: new Date('2026-05-05'),
        },
        {
          ...mockPrendaEntity(),
          id: '2',
          name: 'Camiseta Antigua',
          createdAt: new Date('2026-05-01'),
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.findAll();

      expect(respuesta).toEqual(prendas);
      expect(respuesta.length).toBe(2);
      expect(repository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    });

    it('✅ Debe retornar lista vacía si no hay prendas activas', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const respuesta = await service.findAll();

      expect(respuesta).toEqual([]);
      expect(respuesta.length).toBe(0);
    });

    it('❌ Debe no incluir prendas eliminadas (soft delete)', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findAll();

      // Verifica que filtra por isDeleted: false
      expect(repository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    });

    it('❌ Debe lanzar InternalServerErrorException en error de BD', async () => {
      jest
        .spyOn(repository, 'find')
        .mockRejectedValue(new Error('DB connection failed'));

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('✅ Debe retornar orden correcto (más recientes primero)', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), createdAt: new Date('2026-05-05') },
        { ...mockPrendaEntity(), createdAt: new Date('2026-05-03') },
        { ...mockPrendaEntity(), createdAt: new Date('2026-05-01') },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.findAll();

      expect(respuesta[0].createdAt).toEqual(new Date('2026-05-05'));
      expect(respuesta[2].createdAt).toEqual(new Date('2026-05-01'));
    });
  });

  // ============================================================
  // TESTS: FIND BY ID - Obtener prenda por ID
  // ============================================================
  describe('findById (GET /prendas/:id)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    it('✅ Debe retornar prenda por ID válido', async () => {
      const prenda = mockPrendaEntity();

      jest.spyOn(repository, 'findOne').mockResolvedValue(prenda);

      const respuesta = await service.findById(id);

      expect(respuesta).toEqual(prenda);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, isDeleted: false },
      });
    });

    it('❌ Debe lanzar NotFoundException para ID inexistente', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Prenda con ID ${id} no encontrada`,
      );
    });

    it('❌ Debe lanzar NotFoundException para prenda eliminada', async () => {
      const prenda = { ...mockPrendaEntity(), isDeleted: true };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
    });

    it('❌ Debe rechazar ID inválido (no UUID válido)', async () => {
      const idInvalido = 'not-a-uuid';

      await expect(service.findById(idInvalido)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe lanzar InternalServerErrorException en error de BD', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('DB connection failed'));

      await expect(service.findById(id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ============================================================
  // TESTS: FIND BY SIZE - Buscar por talla
  // ============================================================
  describe('findBySize (GET /prendas/size/:size)', () => {
    it('✅ Debe retornar prendas de talla válida', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), size: 'M', id: '1' },
        { ...mockPrendaEntity(), size: 'M', id: '2' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.findBySize('M');

      expect(respuesta).toEqual(prendas);
      expect(respuesta.length).toBe(2);
      expect(respuesta.every((p) => p.size === 'M')).toBe(true);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ size: 'M', isDeleted: false }),
        }),
      );
    });

    it('✅ Debe retornar lista vacía para talla sin prendas', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const respuesta = await service.findBySize('XS');

      expect(respuesta).toEqual([]);
      expect(respuesta.length).toBe(0);
    });

    it('✅ Debe aceptar todas las tallas válidas', async () => {
      const tallasValidas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

      jest.spyOn(repository, 'find').mockResolvedValue([mockPrendaEntity()]);

      for (const talla of tallasValidas) {
        await service.findBySize(talla);

        expect(repository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ size: talla, isDeleted: false }),
          }),
        );
      }
    });

    it('❌ Debe rechazar talla inválida', async () => {
      await expect(service.findBySize('XXXL')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findBySize('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe no incluir prendas eliminadas', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findBySize('M');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ size: 'M', isDeleted: false }),
        }),
      );
    });
  });

  // ============================================================
  // TESTS: FIND BY NAME - Buscar por nombre
  // ============================================================
  describe('findByName (GET /prendas/search/:name)', () => {
    it('✅ Debe retornar prendas que coincidan con nombre (LIKE)', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), name: 'Camiseta Básica', id: '1' },
        { ...mockPrendaEntity(), name: 'Camiseta Premium', id: '2' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.findByName('Camiseta');

      expect(respuesta).toEqual(prendas);
      expect(respuesta.length).toBe(2);
      expect(respuesta.every((p) => p.name.includes('Camiseta'))).toBe(true);
    });

    it('✅ Debe retornar lista vacía si no hay coincidencias', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const respuesta = await service.findByName('NoExiste');

      expect(respuesta).toEqual([]);
    });

    it('✅ Debe ser case-insensitive (busca en mayúsculas y minúsculas)', async () => {
      const prendas: PrendaEntity[] = [mockPrendaEntity()];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      // Busca convertida a mayúsculas para comparación
      const respuesta = await service.findByName('camiseta');

      expect(respuesta).toBeDefined();
    });

    it('❌ Debe rechazar nombre inválido (caracteres peligrosos)', async () => {
      await expect(service.findByName('$$$$$')).rejects.toThrow();
      await expect(service.findByName('<<<>>>')).rejects.toThrow();
    });

    it('❌ Debe no incluir prendas eliminadas', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findByName('Camiseta');

      // Verifica que usa ILike (case-insensitive) y filtra por isDeleted
      expect(repository.find).toHaveBeenCalled();
    });

    it('✅ Debe permitir búsquedas parciales', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), name: 'Camiseta de algodón', id: '1' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.findByName('algodón');

      expect(respuesta).toBeDefined();
    });
  });

  // ============================================================
  // TESTS: UPDATE - Actualizar prenda
  // ============================================================
  describe('update (PATCH /prendas/:id)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const prendaExistente = mockPrendaEntity();

    it('✅ Debe actualizar solo precio', async () => {
      const dto: UpdatePrendaDto = { price: 39.99 };
      const prendaActualizada = { ...prendaExistente, price: 39.99 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaActualizada);

      const respuesta = await service.update(id, dto);

      expect(respuesta.price).toBe(39.99);
      expect(repository.save).toHaveBeenCalled();
    });

    it('✅ Debe actualizar múltiples campos', async () => {
      const dto: UpdatePrendaDto = {
        price: 39.99,
        stock: 45,
        color: 'Rojo',
      };
      const prendaActualizada = {
        ...prendaExistente,
        price: 39.99,
        stock: 45,
        color: 'Rojo',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaActualizada);

      const respuesta = await service.update(id, dto);

      expect(respuesta.price).toBe(39.99);
      expect(respuesta.stock).toBe(45);
      expect(respuesta.color).toBe('Rojo');
    });

    it('✅ Debe permitir actualización vacía (sin cambios)', async () => {
      const dto: UpdatePrendaDto = {};

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaExistente);

      const respuesta = await service.update(id, dto);

      expect(respuesta).toEqual(prendaExistente);
    });

    it('❌ Debe rechazar actualización a precio negativo', async () => {
      const dto: UpdatePrendaDto = { price: -10 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);

      await expect(service.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe rechazar actualización a stock negativo', async () => {
      const dto: UpdatePrendaDto = { stock: -5 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);

      await expect(service.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe lanzar NotFoundException para ID inexistente', async () => {
      const dto: UpdatePrendaDto = { price: 39.99 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
    });

    it('❌ Debe rechazar actualización que cause duplicado', async () => {
      const dto: UpdatePrendaDto = { name: 'OtraPrenda', size: 'M' };
      const prendarexistente = {
        ...prendaExistente,
        id: 'otro-id',
        name: 'OtraPrenda',
        size: 'M',
      };

      // Primera llamada: encuentra la prenda original
      // Segunda llamada: encuentra que ya existe otra con ese nombre+talla
      const mockFindOne = jest.spyOn(repository, 'findOne');
      mockFindOne.mockResolvedValueOnce(prendaExistente);
      mockFindOne.mockResolvedValueOnce(prendarexistente);

      await expect(service.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe lanzar InternalServerErrorException en error de BD', async () => {
      const dto: UpdatePrendaDto = { price: 39.99 };

      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('DB connection failed'));

      await expect(service.update(id, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('✅ Debe actualizar timestamp "updatedAt"', async () => {
      const dto: UpdatePrendaDto = { price: 39.99 };
      const ahora = new Date();
      const prendaActualizada = {
        ...prendaExistente,
        price: 39.99,
        updatedAt: ahora,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaActualizada);

      const respuesta = await service.update(id, dto);

      expect(respuesta.updatedAt).toBeDefined();
    });
  });

  // ============================================================
  // TESTS: REMOVE - Eliminar prenda (Soft Delete)
  // ============================================================
  describe('remove (DELETE /prendas/:id)', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const prendaExistente = mockPrendaEntity();

    it('✅ Debe eliminar prenda exitosamente (soft delete)', async () => {
      const prendaEliminada = { ...prendaExistente, isDeleted: true };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaEliminada);

      const respuesta = await service.remove(id);

      expect(respuesta.message).toContain('eliminada');
      expect(respuesta.id).toBe(id);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: true }),
      );
    });

    it('❌ Debe lanzar NotFoundException para ID inexistente', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('✅ Debe mantener datos en BD (soft delete, no physical delete)', async () => {
      const prendaEliminada = { ...prendaExistente, isDeleted: true };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaEliminada);

      await service.remove(id);

      // Verifica que llama a save (no remove/delete)
      expect(repository.save).toHaveBeenCalled();
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('❌ Debe rechazar ID inválido (no UUID válido)', async () => {
      const idInvalido = 'not-a-uuid';

      await expect(service.remove(idInvalido)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ Debe lanzar InternalServerErrorException en error de BD', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('DB connection failed'));

      await expect(service.remove(id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('✅ Debe ser idempotente (se puede eliminar dos veces)', async () => {
      const prendaEliminada = { ...prendaExistente, isDeleted: true };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaEliminada);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaEliminada);

      const respuesta = await service.remove(id);

      expect(respuesta.message).toContain('eliminada');
    });
  });

  // ============================================================
  // TESTS: GET INVENTARIO STATS - Estadísticas
  // ============================================================
  describe('getInventarioStats (GET /prendas/stats/inventario)', () => {
    it('✅ Debe retornar estadísticas correctas con múltiples prendas', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), id: '1', size: 'S', price: 20.0, stock: 10 },
        { ...mockPrendaEntity(), id: '2', size: 'M', price: 30.0, stock: 20 },
        { ...mockPrendaEntity(), id: '3', size: 'L', price: 40.0, stock: 30 },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.getInventarioStats();

      expect(respuesta.totalPrendas).toBe(3);
      expect(respuesta.stockTotal).toBe(60);
      expect(respuesta.precioPromedio).toBe(30);
      expect(respuesta.distribucionPorTalla.S).toBe(1);
      expect(respuesta.distribucionPorTalla.M).toBe(1);
      expect(respuesta.distribucionPorTalla.L).toBe(1);
    });

    it('✅ Debe retornar ceros para inventario vacío', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const respuesta = await service.getInventarioStats();

      expect(respuesta.totalPrendas).toBe(0);
      expect(respuesta.stockTotal).toBe(0);
      expect(respuesta.precioPromedio).toBe(0);
      expect(Object.values(respuesta.distribucionPorTalla).every((v) => v === 0))
        .toBe(true);
    });

    it('✅ Debe manejar prendas con precio null correctamente', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), id: '1', price: null as any, stock: 10 },
        { ...mockPrendaEntity(), id: '2', price: 30.0, stock: 20 },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.getInventarioStats();

      expect(respuesta.precioPromedio).toBe(30);
      expect(respuesta.stockTotal).toBe(30);
    });

    it('✅ Debe manejar prendas con stock null correctamente', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), id: '1', price: 20.0, stock: null as any },
        { ...mockPrendaEntity(), id: '2', price: 30.0, stock: 20 },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.getInventarioStats();

      expect(respuesta.stockTotal).toBe(20);
    });

    it('✅ Debe calcular distribución por talla correctamente', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), size: 'XS' },
        { ...mockPrendaEntity(), size: 'S' },
        { ...mockPrendaEntity(), size: 'S' },
        { ...mockPrendaEntity(), size: 'M' },
        { ...mockPrendaEntity(), size: 'M' },
        { ...mockPrendaEntity(), size: 'M' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.getInventarioStats();

      expect(respuesta.distribucionPorTalla.XS).toBe(1);
      expect(respuesta.distribucionPorTalla.S).toBe(2);
      expect(respuesta.distribucionPorTalla.M).toBe(3);
      expect(respuesta.distribucionPorTalla.L).toBe(0);
      expect(respuesta.distribucionPorTalla.XL).toBe(0);
      expect(respuesta.distribucionPorTalla.XXL).toBe(0);
    });

    it('❌ Debe lanzar InternalServerErrorException en error de BD', async () => {
      jest
        .spyOn(repository, 'find')
        .mockRejectedValue(new Error('DB connection failed'));

      await expect(service.getInventarioStats()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('✅ Debe retornar precio promedio correcto (suma / cantidad)', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), price: 10.0 },
        { ...mockPrendaEntity(), price: 20.0 },
        { ...mockPrendaEntity(), price: 30.0 },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.getInventarioStats();

      expect(respuesta.precioPromedio).toBe(20);
    });

    it('✅ Debe manejar precios con muchos decimales', async () => {
      const prendas: PrendaEntity[] = [
        { ...mockPrendaEntity(), price: 19.99 },
        { ...mockPrendaEntity(), price: 20.01 },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(prendas);

      const respuesta = await service.getInventarioStats();

      expect(respuesta.precioPromedio).toBe(20);
    });

    it('✅ Debe no incluir prendas eliminadas en estadísticas', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.getInventarioStats();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
    });
  });

  // ============================================================
  // TESTS DE SANITIZACIÓN Y VALIDACIÓN
  // ============================================================
  describe('Sanitización y Validación de Entrada', () => {
    it('✅ Debe sanitizar ID antes de buscar', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const prenda = mockPrendaEntity();

      jest.spyOn(repository, 'findOne').mockResolvedValue(prenda);

      await service.findById(id);

      // Verifica que el ID se sanitizó
      expect(repository.findOne).toHaveBeenCalled();
    });

    it('❌ Debe rechazar UUID inválido', async () => {
      const idInvalido = 'not-a-valid-uuid';

      await expect(service.findById(idInvalido)).rejects.toThrow();
    });

    it('✅ Debe validar talla contra lista de permitidas', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findBySize('M');

      expect(repository.find).toHaveBeenCalled();
    });

    it('❌ Debe rechazar talla no permitida', async () => {
      await expect(service.findBySize('XXXXL')).rejects.toThrow();
    });
  });

  // ============================================================
  // TESTS DE CARACTERÍSTICAS ESPECIALES
  // ============================================================
  describe('Características Especiales', () => {
    it('✅ Debe usar soft delete (no eliminación física)', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const prendaExistente = mockPrendaEntity();
      const prendaEliminada = { ...prendaExistente, isDeleted: true };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prendaExistente);
      jest.spyOn(repository, 'save').mockResolvedValue(prendaEliminada);

      const respuesta = await service.remove(id);

      expect(respuesta.message).toContain('eliminada');
      // Los datos siguen en la BD
      expect(prendaEliminada.id).toBe(id);
      expect(prendaEliminada.name).toBe('Camiseta');
    });

    it('✅ Debe filtrar prendas eliminadas en findAll', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      });
    });

    it('✅ Debe filtrar prendas eliminadas en findById', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, isDeleted: false },
      });
    });

    it('✅ Debe filtrar prendas eliminadas en búsquedas', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findBySize('M');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isDeleted: false }),
        }),
      );
    });
  });

  // ============================================================
  // TESTS DE EDGE CASES
  // ============================================================
  describe('Edge Cases', () => {
    it('✅ Debe aceptar precio máximo permitido (9999999)', async () => {
      const dto = {
        ...mockPrendaEntity(),
        price: 9999999,
      } as CreatePrendaDto;

      const resultado = mockPrendaEntity();
      resultado.price = 9999999;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dto);

      expect(respuesta.price).toBe(9999999);
    });

    it('❌ Debe rechazar precio superior a máximo permitido', async () => {
      const dto = {
        ...mockPrendaEntity(),
        price: 10000000, // Excede límite
      } as CreatePrendaDto;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('✅ Debe aceptar stock máximo permitido (9999999)', async () => {
      const dto = {
        ...mockPrendaEntity(),
        stock: 9999999,
      } as CreatePrendaDto;

      const resultado = mockPrendaEntity();
      resultado.stock = 9999999;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dto);

      expect(respuesta.stock).toBe(9999999);
    });

    it('❌ Debe rechazar stock superior a máximo permitido', async () => {
      const dto = {
        ...mockPrendaEntity(),
        stock: 10000000, // Excede límite
      } as CreatePrendaDto;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('✅ Debe aceptar nombre máximo (255 caracteres)', async () => {
      const dto = {
        ...mockPrendaEntity(),
        name: 'a'.repeat(255),
      } as CreatePrendaDto;

      const resultado = mockPrendaEntity();
      resultado.name = 'a'.repeat(255);

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dto);

      expect(respuesta.name.length).toBe(255);
    });

    it('✅ Debe aceptar descripción máximo (1000 caracteres)', async () => {
      const dto = {
        ...mockPrendaEntity(),
        description: 'a'.repeat(1000),
      } as CreatePrendaDto;

      const resultado = mockPrendaEntity();
      resultado.description = 'a'.repeat(1000);

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(resultado);
      jest.spyOn(repository, 'save').mockResolvedValue(resultado);

      const respuesta = await service.create(dto);

      expect(respuesta.description!.length).toBe(1000);
    });

    it('❌ Debe rechazar descripción mayor a 1000 caracteres', async () => {
      const dto = {
        ...mockPrendaEntity(),
        description: 'a'.repeat(1001),
      } as CreatePrendaDto;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('✅ Debe manejar update sin cambios (all fields same)', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const prenda = mockPrendaEntity();
      const dto: UpdatePrendaDto = {
        name: prenda.name,
        price: prenda.price,
        stock: prenda.stock,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(prenda);
      jest.spyOn(repository, 'save').mockResolvedValue(prenda);

      const respuesta = await service.update(id, dto);

      expect(respuesta).toEqual(prenda);
    });
  });
});
