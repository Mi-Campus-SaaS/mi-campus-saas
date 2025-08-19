import { Controller, Get, Res } from '@nestjs/common';
import { HealthService } from './health.service';
import type { Response } from 'express';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Liveness probe: app is up and can serve requests
  @Get('healthz')
  liveness() {
    return { status: 'ok' };
  }

  // Readiness probe: dependencies are ready (DB/Redis/Storage)
  @Get('readyz')
  async readiness(@Res() res: Response) {
    const result = await this.healthService.checkReadiness();
    const isReady = result.status === 'ok';
    return res.status(isReady ? 200 : 503).json(result);
  }
}
