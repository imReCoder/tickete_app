import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PrismaModule } from '../database/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobService } from './job.service';
import { HttpModule } from '@nestjs/axios';
import { ApiService } from './api.service';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), HttpModule, ProductModule],
  providers: [SyncService, JobService, ApiService],
})
export class SyncModule {}
