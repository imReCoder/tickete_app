import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaxAvailibilityDto, SlotDto } from 'src/common/dtos/slots.dto';
import { PrismaService } from 'src/modules/database/prisma.service';

@Injectable()
export class SlotsService {
  private logger = new Logger(SlotsService.name);

  constructor(private prisma: PrismaService) {}

  getSlots(productId:number,date:string){
    // TODO : validation
    console.log(`Fetching slots for ProductId ${productId} , Date: ${date}`);
    return this.prisma.slots.findMany({
      where:{
        productId:productId,
        startDate:date
      },
      include:{
        paxAvailibility:{
          include:{
            price:true
          }
        },
      }
    })
  }


  async bulkUpsertSlots(
    slotsBatch: { data: any[]; productId: number; date: string }[],
    batchSize: number = 50,
  ) {
    const allSlots:any[] = Array.from(slotsBatch.flatMap(({ productId, data }) =>
      data.map((slot) => ({ ...slot, productId })),
    ) .reduce((acc, slot) => {
      acc.set(slot.providerSlotId, slot); // Store unique slots using providerSlotId as the key
      return acc;
    }, new Map())
    .values());

    const allProductIds = Array.from(
      new Set(slotsBatch.map((slot) => slot.productId)),
    );
    const allDates = Array.from(new Set(slotsBatch.map((slot) => slot.date)));

    // Process slots in batches
    await Promise.all(
      this.chunkArray(allSlots, batchSize).map((batch) =>
        this.bulkUpsertSlotsIntoDb(
          batch.map((slot) => this.convertToDto<SlotDto>(slot, SlotDto)),
        ),
      ),
    );

    // Delete additional slots not in the upserted batch
    const slotsIdToKeep = allSlots.map((s) => s.providerSlotId);
    await this.bulkDeleteAdditionalSlots(
      slotsIdToKeep,
      allProductIds,
      allDates,
    );


    const paxData:PaxAvailibilityDto[] = allSlots.flatMap((slot) => {
      const slotData = allSlots.find(
        (s) => s.providerSlotId === slot.providerSlotId,
      );
      console.log("slot data ",slotData)
      return slotData.paxAvailability.map((pax) => ({
        slotId: slot.providerSlotId,
        remaining: pax.remaining,
        type: pax.type,
        description: pax.description,
        name: pax.name ??  Prisma.raw('NULL'),
        min:pax.min ??  Prisma.raw('NULL'),
        max:pax.max ??  Prisma.raw('NULL'),
        price:pax.price
      }));
    });

    // Process pax in batches
    const upsertedPax = await Promise.all(
      this.chunkArray(paxData, batchSize).map((batch) =>
        this.bulkUpsertPaxAvailibility(
          batch.map((slot) =>
            this.convertToDto<PaxAvailibilityDto>(slot, PaxAvailibilityDto),
          ),
        ),
      ),
    );

    const flatPaxList = upsertedPax.flat(); // Flatten array of arrays
      console.log("flatPaxList ",flatPaxList)
// Prepare Price Data
    const priceData = flatPaxList.flatMap((pax:any) => {
      const originalPax = paxData
        .find((p) => p.slotId === pax.slotId && p.type === pax.type);

      if (originalPax?.price) {
        return [
          {
            id: pax.id, // Newly inserted Pax ID
            finalPrice: originalPax.price.finalPrice,
            currencyCode: originalPax.price.currencyCode,
            originalPrice: originalPax.price.originalPrice,
          },
        ];
      }
      return [];
    });
    
    console.log("Price ",priceData)
    //  Upsert Price Data
     await Promise.all(this.chunkArray(priceData, batchSize).map((batch) => this.bulkUpsertPrice(batch)));
  
  }

  private async bulkUpsertSlotsIntoDb(slots: SlotDto[]) {
    if (!slots.length) return;

    const result = await this.prisma.$queryRaw`
      INSERT INTO "Slots" ("providerSlotId", "startDate", "startTime", "remaining", "productId")
      VALUES ${Prisma.join(
        slots.map(
          (slot) =>
            Prisma.sql`(${slot.providerSlotId}, ${slot.startDate}, ${slot.startTime}, ${slot.remaining}, ${slot.productId})`,
        ),
      )}
      ON CONFLICT ("providerSlotId") DO UPDATE
      SET "startTime" = EXCLUDED."startTime",
          "remaining" = EXCLUDED."remaining",
          "startDate" = EXCLUDED."startDate";
    `;
    console.log('Slots Upsert Result:', result);
  }

  private async bulkUpsertPaxAvailibility(paxData: PaxAvailibilityDto[]) {
    if (!paxData.length) return;
    console.group("Pax to upsert ",paxData);
    const result = await this.prisma.$queryRaw`
      INSERT INTO "PaxAvailibility" ("slotId", "remaining", "type", "name", "description","min","max")
      VALUES ${Prisma.join(
        paxData.map(
          (pax) =>
            Prisma.sql`(${pax.slotId}, ${pax.remaining}, ${pax.type}, ${pax.name}, ${pax.description},${pax.min},${pax.max})`,
        ),
      )}
      ON CONFLICT ("slotId", "type")  DO UPDATE
      SET "remaining" = EXCLUDED."remaining",
        "description" = EXCLUDED."description",
        "name" = EXCLUDED."name",
        "type" = EXCLUDED."type",
        "min"=EXCLUDED."min",
        "max"= EXCLUDED."max"
      RETURNING "id", "slotId", "type";  -- Return IDs of upserted rows
    `;

  console.log('Pax Upsert Result:', result);
          return result;
  }

  private async bulkUpsertPrice(priceData: { id: number; finalPrice: number; currencyCode: string; originalPrice: number }[]) {
    if (!priceData.length) return;

    console.log('Price to upsert', priceData);

    const result = await this.prisma.$queryRaw`
      INSERT INTO "Price" ("id", "finalPrice", "currencyCode", "originalPrice")
      VALUES ${Prisma.join(
        priceData.map(
          (price) =>
            Prisma.sql`(${price.id}, ${price.finalPrice}, ${price.currencyCode}, ${price.originalPrice})`,
        ),
      )}
      ON CONFLICT ("id") DO UPDATE
      SET "finalPrice" = EXCLUDED."finalPrice",
          "currencyCode" = EXCLUDED."currencyCode",
          "originalPrice" = EXCLUDED."originalPrice";
    `;

    console.log('Price Upsert Result:', result);
  }

  private async bulkDeleteAdditionalSlots(
    slotsIdToKeep: string[],
    allProductIds: number[],
    allDates: string[],
  ) {
    const result = await this.prisma.slots.deleteMany({
      where: {
        productId: { in: allProductIds },
        startDate: { in: allDates },
        providerSlotId: { notIn: slotsIdToKeep },
      },
    });
    console.log('Delete result:', result);
  }

  private convertToDto<T = unknown>(input: any, type: any): T {
    return plainToInstance(type, input, { excludeExtraneousValues: true }) as T;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );
  }
}
