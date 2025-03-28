import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { EJobs } from 'src/common/enums/jobs.enums';

@Injectable()
export class JobService {
  constructor(private readonly syncService: SyncService,private schedulerRegistry: SchedulerRegistry) {}

  // Every 5 second for today
  @Cron(CronExpression.EVERY_MINUTE, {
    name: EJobs.JOB_10_SECONDS,
  })
  onEverySecondTrigger() {
    // this.syncService.syncInventroyDataForNext7Days()
  }

  // Every 15 minutes for today
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name:EJobs.JOB_15_MINUTES,
  })
  on15MinutesTrigger() {
    console.log('30 Minutes triggered');
    // this.syncService.syncInventoryDataForNext30Days()

  }

  // Every 4 hours for next 7 days
  @Cron("0 */4 * * *", {
    name: EJobs.JOB_4_HOURS,
  })
  on4HoursTrigger() {
    console.log('On 4 hours triggered');
  }

  // Every 1 day for next 30 days
  @Cron("0 3 * * *", {
    name: EJobs.JOB_1_DAY,
  })
  on1DayTrigger() {
    console.log('1 Day triggered');
  }

  @Timeout(11*1000)
  clearCron(){
    // const jobName = EJobs.JOB_10_SECONDS;
    // const job = this.schedulerRegistry.getCronJob(jobName);
    // job.stop();
    // console.log(`Job ${jobName} - stopped`);
  }
}
