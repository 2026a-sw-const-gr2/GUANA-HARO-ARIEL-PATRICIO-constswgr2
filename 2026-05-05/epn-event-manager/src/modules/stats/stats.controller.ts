import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { EventsService } from '../events/events.service';

@Controller('stats')
@ApiTags('Estadísticas')
@ApiSecurity('X-FIS-EPN-KEY')
export class StatsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener estadísticas del sistema',
    description: 'Retorna estadísticas globales del sistema de eventos',
  })
  @ApiOkResponse({
    description: 'Estadísticas obtenidas exitosamente',
  })
  getStats() {
    return this.eventsService.getStats();
  }
}
