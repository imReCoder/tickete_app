import { Module } from '@nestjs/common';
import { SlotsService } from './slots/slots.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports:[PrismaModule],
  providers: [SlotsService]
})
export class ExperienceModule {}
