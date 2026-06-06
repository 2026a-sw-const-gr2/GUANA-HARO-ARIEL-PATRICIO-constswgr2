/**
 * ENTIDAD - Prenda (Ropa)
 * 
 * Representa una prenda en el inventario con:
 * - Identificación única
 * - Atributos de negocio (talla, precio, stock)
 * - Timestamps de auditoría
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('prendas')
export class PrendaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Mantenimiento Correctivo: Campo de nombre con límite de caracteres
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  // Descripción de la prenda
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Mantenimiento Preventivo: Validar talla contra conjunto permitido
  // Valores válidos: XS, S, M, L, XL, XXL
  @Column({ type: 'varchar', length: 10, nullable: false })
  size: string;

  // Mantenimiento Preventivo: Precio no negativo y con 2 decimales
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  // Mantenimiento Preventivo: Stock no negativo
  @Column({ type: 'int', nullable: false, default: 0 })
  stock: number;

  // Color de la prenda
  @Column({ type: 'varchar', length: 100, nullable: true })
  color: string | null;

  // Material de fabricación
  @Column({ type: 'varchar', length: 100, nullable: true })
  material: string | null;

  // Mantenimiento Adaptativo: Timestamps en ISO-8601 automáticos
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  // Mantenimiento Preventivo: Marcar como eliminada lógicamente
  @Column({ type: 'boolean', nullable: false, default: false })
  isDeleted: boolean;
}
