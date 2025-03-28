import { Module } from '@nestjs/common';
import { SlotsService } from './slots/slots.service';
import { PrismaModule } from '../database/prisma.module';
import { SlotController } from './slots/slot.controller';

@Module({
  imports:[PrismaModule],
  providers: [SlotsService],
  exports:[SlotsService],
  controllers:[SlotController]
})
export class ExperienceModule {}
