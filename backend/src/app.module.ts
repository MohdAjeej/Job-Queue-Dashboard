import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [JobsModule, HealthModule],
})
export class AppModule {}
