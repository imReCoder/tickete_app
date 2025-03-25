import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SyncService } from './sync.service';

@Injectable()
export class JobService {

    constructor(private readonly syncService:SyncService){
        
    }

    // Every 15 minutes for today
    @Cron('0 */15 * * * *')
    on15MinutesTrigger() {
        console.log("15 Minutes triggered");
    }

    // Every 4 hours for next 7 days
    @Cron('0 0 */4 * * *')
    on4HoursTrigger() {
        console.log("On 4 hours triggered");
    }

    // Every 1 day for next 30 days
    @Cron('0 0 0 * * *')
    on1DayTrigger() {
        console.log("1 Day triggered");
    }

}
