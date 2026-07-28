import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const elapsedSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
      const route = (req.route?.path as string | undefined) ?? req.path;
      this.metricsService.httpRequestDuration.observe(
        { method: req.method, route, status_code: res.statusCode },
        elapsedSeconds,
      );
    });

    next();
  }
}
