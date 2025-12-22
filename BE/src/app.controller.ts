import { Controller, Get } from '@nestjs/common';
import { ok } from './common/api-response';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  health() {
    return ok({ service: 'be-fe-demo', timestamp: new Date().toISOString() }, 'OK');
  }
}
