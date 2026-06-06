import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { StatsModule } from './modules/stats/stats.module';
import { PrendasModule } from './modules/prendas/prendas.module';
import { ApiKeyMiddleware } from './common/middleware/api-key.middleware';

@Module({
  imports: [
    // Mantenimiento Adaptativo: Cargar variables de entorno desde .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    DatabaseModule,
    EventsModule,
    HealthModule,
    StatsModule,
    PrendasModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Registrar middleware de API-Key en todas las rutas
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
