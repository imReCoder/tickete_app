import { Injectable } from '@nestjs/common';
import {
  Cron,
  CronExpression,
  SchedulerRegistry,
  Timeout,
} from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { EJobs } from 'src/common/enums/jobs.enums';

@Injectable()
export class JobService {
  constructor(
    private readonly syncService: SyncService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  // Every 15 minutes for today
  @Cron("0 */15 * * * *", {
    name: EJobs.JOB_15_MINUTES,
  })
  on15MinutesTrigger() {
    this.syncService.syncInventroyDataForToday();

  }

  // Every 4 hours for next 7 days
  @Cron(CronExpression.EVERY_4_HOURS, {
    name: EJobs.JOB_4_HOURS,
  })
  on4HoursTrigger() {
    this.syncService.syncInventroyDataForNext7Days();
  }

  // Every 1 day for next 30 days
  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: EJobs.JOB_1_DAY,
  })
  on1DayTrigger() {
    this.syncService.syncInventoryDataForNext30Days();
  }
}
