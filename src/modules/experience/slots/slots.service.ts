import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSlotDto } from 'src/common/dtos/slots.dto';
import { PrismaService } from 'src/modules/database/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async bulkUpsertSlots(slotsBatch: any[], batchSize: number = 50) {
    console.log("Slots Batch Received",slotsBatch)
    // Flatten batch data
    const slots = slotsBatch.flatMap(({ productId, data }) =>
      data.map((slot: any) => ({ ...slot, productId })),
    );

    // Process in batches to prevent DB overload
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, Math.min(i + batchSize,slots.length));

      // Step 1: Fetch existing slots (only relevant ones)
      const existingSlots = await this.prisma.slots.findMany({
        where: {
          OR: batch.map((slot) => ({
            productId: slot.productId,
            startDate: slot.startDate,
            startTime: slot.startTime,
          })),
        },
        select: {
          productId: true,
          startDate: true,
          startTime: true,
        },
      });

      // Step 2: Create lookup set for fast checking
      const existingSet = new Set(
        existingSlots.map(
          (slot) => `${slot.productId}-${slot.startDate}-${slot.startTime}`,
        ),
      );

      // Step 3: Separate inserts & updates
      const toInsert = batch.filter(
        (slot) => !existingSet.has(`${slot.productId}-${slot.startDate}-${slot.startTime}`),
      ).map(slot=>  this.convertToDto(slot));

      const toUpdate = batch.filter((slot) =>
        existingSet.has(`${slot.productId}-${slot.startDate}-${slot.startTime}`),
      ).map(slot=>  this.convertToDto(slot));;
    console.log(`To Insert : ${toInsert.length}`)
    console.log(`To Update : ${toUpdate.length}`)
console.log("To insert",toInsert)
      // Step 4: Bulk Insert for new records
      if (toInsert.length > 0) {
        await this.prisma.slots.createMany({
          data:toInsert as Prisma.SlotsCreateManyInput[]
        });
      }

      // Step 5: Bulk Update for existing records
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((slot) =>
            this.prisma.slots.updateMany({
              where: {
                productId: slot.productId,
                startDate: slot.startDate,
                startTime: slot.startTime,
              },
              data: { ...slot },
            }),
          ),
        );
      }
    }
  }


   convertToDto(input: any) {

    const dtoInstance = plainToInstance(CreateSlotDto, input,{
        excludeExtraneousValues: true
      });
    return dtoInstance;
  }
  
}
