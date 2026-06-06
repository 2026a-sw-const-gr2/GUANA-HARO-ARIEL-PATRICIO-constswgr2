import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('Root')
@ApiSecurity('X-FIS-EPN-KEY')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Mensaje de bienvenida',
    description: 'Endpoint raíz que verifica la disponibilidad de la API',
  })
  @ApiOkResponse({
    description: 'Mensaje de bienvenida',
    schema: {
      example: 'Hola desde NestJS',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
