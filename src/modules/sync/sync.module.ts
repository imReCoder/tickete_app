import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PrismaModule } from '../database/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobService } from './job.service';
import { HttpModule } from '@nestjs/axios';
import { ApiService } from './api.service';

@Module({
  imports:[PrismaModule, ScheduleModule.forRoot(),HttpModule],
  providers: [SyncService,JobService,ApiService]
})
export class SyncModule {}
