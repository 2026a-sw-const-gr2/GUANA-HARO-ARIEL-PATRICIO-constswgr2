import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
@ApiSecurity('X-FIS-EPN-KEY')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Verificar estado de la API',
    description: 'Endpoint para verificar que la API está operativa y disponible',
  })
  @ApiOkResponse({
    description: 'API operativa',
    schema: {
      example: {
        status: 'ok',
        timestamp: '24/5/2026 21:30:00',
      },
    },
  })
  check() {
    // Incidencia preventiva: siempre responde ok sin verificar conectividad real
    return { status: 'ok', timestamp: new Date().toLocaleString() };
  }
}
