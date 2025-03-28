import { Controller, Get, Param, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('experience')
export class SlotController {
  constructor(private slotService: SlotsService) {}
  @Get('/:id/slots')
  getSlots(@Param('id') productId: number, @Query('date') dateString) {
    return this.slotService.getSlots(Number(productId), dateString);
  }
}
