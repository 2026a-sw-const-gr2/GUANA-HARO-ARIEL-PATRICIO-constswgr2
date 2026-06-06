/**
 * MÓDULO - Prendas
 * 
 * Integra:
 * - Controlador de Prendas
 * - Servicio de Prendas
 * - Cliente de Event Manager
 * - Entidad de Prenda (TypeORM)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrendasController } from './controllers/prendas.controller';
import { PrendasService } from './services/prendas.service';
import { EventManagerClient } from './clients/event-manager.client';
import { PrendaEntity } from './entities/prenda.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrendaEntity]) // <-- ¡Esto es lo que suele faltar!
  ],
  controllers: [PrendasController],
  providers: [PrendasService, EventManagerClient],
  exports: [PrendasService, EventManagerClient],
})
export class PrendasModule {}
