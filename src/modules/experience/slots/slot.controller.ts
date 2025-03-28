import { Controller, Get, Param, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller({path:'experience',version:'1'})
export class SlotController {
  constructor(private slotService: SlotsService) {}
  @Get('/:id/slots')
  getSlots(@Param('id') productId: number, @Query('date') dateString) {
    return this.slotService.getSlots(Number(productId), dateString);
  }

  @Get('/:id/dates')
  getDates(@Param('id') productId: number, @Query('date') dateString) {
    return this.slotService.getDates(Number(productId), dateString);
  }

}
