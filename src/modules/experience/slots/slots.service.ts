import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaxAvailibilityDto, SlotDto } from 'src/common/dtos/slots.dto';
import { chunkArray, convertToDto } from 'src/common/utils/common.util';
import { PrismaService } from 'src/modules/database/prisma.service';
import * as dayjs from 'dayjs';
import { ERROR_MESSAGES } from 'src/common/constants/message.constants';
@Injectable()
export class SlotsService {
  private logger = new Logger(SlotsService.name);

  constructor(private prisma: PrismaService) {}

  getSlots(productId: number, date: string) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new HttpException(
        ERROR_MESSAGES.INVALID_PRODUCT_ID,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
      throw new HttpException(
        ERROR_MESSAGES.INVALID_DATE_FORMAT,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.prisma.slots.findMany({
      where: {
        productId: productId,
        startDate: date,
      },
      select: {
        startTime: true,
        startDate: true,
        remaining: true,
        paxAvailibility: {
          select: {
            type: true,
            name: true,
            description: true,
            min: true,
            max: true,
            remaining: true,
            price: true,
          },
        },
      },
    });
  }

  async getDates(productId: number, date: string) {
    const uniqueDatesWithPrice = await this.prisma.slots.findMany({
      where: {
        productId,
      },
      select: {
        startDate: true,
        paxAvailibility: {
          select: {
            price: {
              select: {
                finalPrice: true,
                currencyCode: true,
                originalPrice: true,
              },
            },
          },
          take: 1,
        },
      },
      distinct: ['startDate'], // Ensures unique dates
    });

    const result = uniqueDatesWithPrice.map((item) => ({
      startDate: item.startDate,
      price: item.paxAvailibility?.[0]?.price ?? null,
    }));

    return result;
  }

  async bulkUpsertSlots(
    slotsBatch: { data: any[]; productId: number; date: string }[],
    batchSize: number = 50,
  ): Promise<void> {
    try {
      const allSlots = this.getUniqueSlots(slotsBatch);
      this.logger.log(`${allSlots.length} unique slots`);

      const allProductIds = Array.from(
        new Set(slotsBatch.map(({ productId }) => productId)),
      );
      const allDates = Array.from(new Set(slotsBatch.map(({ date }) => date)));

      await this.processSlots(allSlots, batchSize);

      const paxData = this.preparePaxData(allSlots);
      const upsertedPax = await this.processPax(paxData, batchSize);

      const priceData = this.preparePriceData(paxData, upsertedPax);
      await this.processPrices(priceData, batchSize);

      await this.bulkDeleteAdditionalSlots(
        allSlots.map((s) => s.providerSlotId),
        allProductIds,
        allDates,
      );

      this.logger.log(`${allSlots.length} slots processed.`);
    } catch (error) {
      this.logger.error(`Error processing batch: ${error.message}`, error);
    }
  }

  /**
   * Extracts unique slots from the batch.
   */
  private getUniqueSlots(
    slotsBatch: { data: any[]; productId: number }[],
  ): any[] {
    return Array.from(
      slotsBatch
        .flatMap(({ productId, data }) =>
          data.map((slot) => ({ ...slot, productId })),
        )
        .reduce((acc, slot) => acc.set(slot.providerSlotId, slot), new Map())
        .values(),
    );
  }

  /**
   * Processes slot upsert in batches.
   */
  private async processSlots(slots: any[], batchSize: number): Promise<void> {
    await Promise.all(
      chunkArray(slots, batchSize).map((batch) =>
        this.bulkUpsertSlotsIntoDb(
          batch.map((slot) => convertToDto<SlotDto>(slot, SlotDto)),
        ),
      ),
    );
  }

  /**
   * Prepares Pax Availability data.
   */
  private preparePaxData(slots: any[]): PaxAvailibilityDto[] {
    return slots.flatMap(({ providerSlotId, paxAvailability }) =>
      paxAvailability.map((pax) => ({
        slotId: providerSlotId,
        remaining: pax.remaining,
        type: pax.type,
        description: pax.description,
        name: pax.name ?? Prisma.raw('NULL'),
        min: pax.min ?? Prisma.raw('NULL'),
        max: pax.max ?? Prisma.raw('NULL'),
        price: pax.price,
      })),
    );
  }

  /**
   * Processes Pax Availability upsert in batches.
   */
  private async processPax(
    paxData: PaxAvailibilityDto[],
    batchSize: number,
  ): Promise<any[]> {
    const upsertedPax = await Promise.all(
      chunkArray(paxData, batchSize).map((batch) =>
        this.bulkUpsertPaxAvailibility(
          batch.map((pax) =>
            convertToDto<PaxAvailibilityDto>(pax, PaxAvailibilityDto),
          ),
        ),
      ),
    );
    return upsertedPax.flat();
  }

  /**
   * Prepares price data for upsert.
   */
  private preparePriceData(
    paxData: PaxAvailibilityDto[],
    upsertedPax: any[],
  ): any[] {
    return upsertedPax.flatMap((pax) => {
      const originalPax = paxData.find(
        (p) => p.slotId === pax.slotId && p.type === pax.type,
      );
      return originalPax?.price
        ? [
            {
              id: pax.id,
              finalPrice: originalPax.price.finalPrice,
              currencyCode: originalPax.price.currencyCode,
              originalPrice: originalPax.price.originalPrice,
            },
          ]
        : [];
    });
  }

  /**
   * Processes price data upsert in batches.
   */
  private async processPrices(
    priceData: any[],
    batchSize: number,
  ): Promise<void> {
    await Promise.all(
      chunkArray(priceData, batchSize).map((batch) =>
        this.bulkUpsertPrice(batch),
      ),
    );
  }

  private async bulkUpsertSlotsIntoDb(slots: SlotDto[]) {
    if (!slots.length) return;
    try {
      const result = await this.prisma.$queryRaw<{ providerSlotId: string }[]>`
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
          "startDate" = EXCLUDED."startDate"
      RETURNING "providerSlotId";
    `;

      this.logger.log(`Slots: Affected ${result.length} rows`);
    } catch (e) {
      this.logger.error(`Error in process pax data | ${e.message}`);
    }
  }

  private async bulkUpsertPaxAvailibility(paxData: PaxAvailibilityDto[]) {
    if (!paxData.length) return;
    try {
      const result = await this.prisma.$queryRaw<
        { id: number; slotId: string; type: string }[]
      >`
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
      this.logger.log(`Pax: Affected ${result.length} rows`);
      return result;
    } catch (e) {
      this.logger.error(`Error in upserting pax data | ${e.message}`);
      return [];
    }
  }

  private async bulkUpsertPrice(
    priceData: {
      id: number;
      finalPrice: number;
      currencyCode: string;
      originalPrice: number;
    }[],
  ) {
    if (!priceData.length) return;
    try {
      const result = await this.prisma.$queryRaw<{ id: string }[]>`
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
          "originalPrice" = EXCLUDED."originalPrice"
      RETURNING "id";  -- Return IDs of upserted rows
    `;
      this.logger.log(`Price : affected ${result.length} rows`);
    } catch (e) {
      this.logger.error(`Error in processing price data | ${e.message}`);
    }
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
    this.logger.warn(`Delete ${result.count} slots`);
  }
}
