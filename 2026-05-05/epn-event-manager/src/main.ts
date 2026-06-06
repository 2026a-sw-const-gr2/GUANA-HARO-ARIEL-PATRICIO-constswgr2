import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Mantenimiento Perfectivo: Configurar Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('EPN Event Manager - API de Prendas')
    .setDescription(
      'API REST para gestión de inventario de venta de ropa con CRUD completo, búsquedas, estadísticas y soft delete.',
    )
    .setVersion('1.0.0')
    .addApiKey(
      { type: 'apiKey', name: 'X-FIS-EPN-KEY', in: 'header', description: 'API Key obligatoria: X-FIS-EPN-KEY' },
      'X-FIS-EPN-KEY',
    )
    .addSecurity('X-FIS-EPN-KEY', {
      type: 'apiKey',
      name: 'X-FIS-EPN-KEY',
      in: 'header',
      description: 'API Key para autenticación',
    })
    .addTag('Prendas (Ropa)', 'Operaciones CRUD para gestión de prendas de ropa')
    .addTag('Estadísticas', 'Endpoints para obtener estadísticas del sistema')
    .addTag('Health', 'Verificar estado de la API')
    .setContact(
      'EPN Soporte',
      'https://www.epn.edu.ec',
      'soporte@epn.edu.ec',
    )
    .setLicense(
      'Apache 2.0',
      'https://www.apache.org/licenses/LICENSE-2.0.html',
    )
    .addServer(
      `http://${configService.get<string>('HOST', 'localhost')}:${configService.get<number>('PORT', 3000)}`,
      'Servidor Actual',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true,
      filter: true,
      deepLinking: true,
    },
    customCss: `.swagger-ui .topbar { display: none }
    .swagger-ui .information-container { background-color: #fafafa }`,
    customfavIcon:
      'https://www.epn.edu.ec/images/logo.png',
  });

  // Obtener configuración desde .env
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', 'localhost');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Mantenimiento Adaptativo: Iniciar servidor con configuración externalizada
  await app.listen(port, host);

  logger.log(`🚀 Servidor iniciado en http://${host}:${port}`);
  logger.log(`📊 Entorno: ${nodeEnv}`);
  logger.log(`🔐 API Key requerida: X-FIS-EPN-KEY en headers`);
  logger.log(`📝 Logs: ./logs/crud.log`);
  logger.log(`📚 Swagger/OpenAPI: http://${host}:${port}/api/docs`);
  logger.log(`📄 OpenAPI JSON: http://${host}:${port}/api-json`);
}

void bootstrap();
