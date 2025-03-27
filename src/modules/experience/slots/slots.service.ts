import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSlotDto } from 'src/common/dtos/slots.dto';
import { PrismaService } from 'src/modules/database/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  // will receive all slots for a prodcut for specific date
  async bulkUpsertSlots(slotsBatch: {data:[],productId:number,date:string}[], batchSize: number = 50) {
    console.log('Slots Batch Received', slotsBatch);
    // Flatten batch data
    const allSlots = slotsBatch.flatMap(({ productId, data }) =>
      data.map((slot: any) => ({ ...slot, productId })),
    );
    const allProductId = slotsBatch.map(slot=>slot.productId);
    const allDates = slotsBatch.map(slot=>slot.date)

    // Process in batches to prevent DB overload
    for (let i = 0; i < allSlots.length; i += batchSize) {
      const batch = allSlots.slice(i, Math.min(i + batchSize, allSlots.length)).map((slot) => this.convertToDto(slot));;
        console.log(batch);
         await this.bulkUpsertSlotsIntoDb(batch)
    }

    // once everything is upserted , we can check for that productid and date and delete the extra slots
    const slotsId = allSlots.map(s=>s.providerSlotId);
    await this.bulkDeleteAdditionalSlots(slotsId,allProductId,allDates);
  }

  async bulkUpsertSlotsIntoDb(slots) {
    const result = await this.prisma.$queryRaw`
    INSERT INTO "Slots" ("providerSlotId","startDate","startTime", "remaining","productId")
    VALUES ${Prisma.join(
      slots.map(
        (slot) =>
          Prisma.sql`(${slot.providerSlotId},${slot.startDate},${slot.startTime}, ${slot.remaining},${slot.productId})`,
      ),
    )}
    ON CONFLICT ("providerSlotId") DO UPDATE
    SET "startTime" = EXCLUDED."startTime",
        "remaining" = EXCLUDED."remaining";
  `;
    console.log("Upsert Result: ",result);
  }

  private async bulkDeleteAdditionalSlots(slotsIdToKeep:string[],allProductId:number[],allDates:string[]){
    console.log("Delete all slots not in ",slotsIdToKeep,allProductId,allDates);
    const checkSlots = await this.prisma.slots.findMany({
        where: {
          productId: { in: allProductId },
          startDate: { in: allDates },
        },
      });
      console.log('Slots found before delete:', checkSlots);
    const result = await this.prisma.slots.deleteMany({
        where: {
          productId:{in:allProductId},
          startDate:{in:allDates},
          providerSlotId: { notIn: slotsIdToKeep }, // Delete everything except the slotsToKeep
        },
      });
      console.log("Delete result ",result)
  }

  convertToDto(input: any) {
    const dtoInstance = plainToInstance(CreateSlotDto, input, {
      excludeExtraneousValues: true,
    });
    return dtoInstance;
  }
}
