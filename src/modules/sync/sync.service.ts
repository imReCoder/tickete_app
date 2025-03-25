import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiService } from './api.service';
import { ProductService } from '../product/product.service';
import * as dayjs from 'dayjs';

@Injectable()
export class SyncService {
  private readonly API_BATCH_SIZE;
  private readonly RATE_LIMIT_PER_MINUTE;

  constructor(
    private readonly productService: ProductService,
    private readonly apiService: ApiService,
  ) {
    this.API_BATCH_SIZE = process.env.API_BATCH_SIZE || 5;
    this.RATE_LIMIT_PER_MINUTE = process.env.RATE_LIMIT_PER_MINUTE;
    console.debug(
      `[Syn Info] - Rate Limit : ${this.RATE_LIMIT_PER_MINUTE} | Batch Size : ${this.API_BATCH_SIZE}`,
    );
  }

  async syncInventroyDataForToday() {
    this._fetchInventoryForDays(1, 0);
  }

  async syncInventroyDataForNext7Days() {
    this._fetchInventoryForDays(7);
  }

  async syncInventoryDataForNext30Days() {
    this._fetchInventoryForDays(30);
  }

  private async _fetchInventoryForDays(days: number, skipDays: number = 1) {
    console.debug(`Fetching for ${days} Days`);
    const products = await this.productService.getAllProducts();
    console.debug(`Total products available: ${products.length}`);

    const today = dayjs();
    const upcomingDays = Array.from({ length: days || 1 }, (_, i) =>
      today.add(i + skipDays, 'day'),
    );

    for (const date of upcomingDays) {
      const dayName = date.format('ddd');
      const formattedDate = date.format('YYYY-MM-DD');

      const availableProducts = products.filter((product) =>
        product.days.includes(dayName),
      );

      console.log(
        `\nDate: ${formattedDate} (${dayName}) - ${availableProducts.length} products available`,
      );
      await this.fetchInventoryInBatches(availableProducts, formattedDate);
      // Delay before moving to the next day to prevent overlapping requests
      const { delayPerBatch } = this.calculateRateLimit(
        this.RATE_LIMIT_PER_MINUTE,
        this.API_BATCH_SIZE,
      );

      console.log(
        `Waiting ${delayPerBatch}ms before fetching for the next day...`,
      );
      await this.delay(delayPerBatch);
    }
  }

  public async fetchInventoryInBatches(products: any[], dateString: string) {
    let allInventoryData: any[] = [];
    const { maxPossibleBatch, delayPerBatch } = this.calculateRateLimit(
      this.RATE_LIMIT_PER_MINUTE,
      this.API_BATCH_SIZE,
    );

    for (let i = 0; i < products.length; i += maxPossibleBatch) {
      const batch = products.slice(i, i + maxPossibleBatch);

      console.log(
        `Processing batch ${i / maxPossibleBatch + 1}/${Math.ceil(products.length / maxPossibleBatch)}`,
      );

      const batchResults = await Promise.allSettled(
        batch.map((product) =>
          this.apiService.fetchInventoryData(product.productId, dateString),
        ),
      );

      const successfulData = batchResults
        .filter((result) => result.status === 'fulfilled')
        .map((result: any) => result.value);

      allInventoryData.push(...successfulData);

      // Add delay only if there are more batches to process
      if (i + maxPossibleBatch < products.length) {
        console.log(`Waiting for ${delayPerBatch}ms before next batch...`);
        await this.delay(delayPerBatch);
      }
    }

    console.log(`Total fetched inventory records: ${allInventoryData.length}`);
    return allInventoryData;
  }

  private calculateRateLimit(rateLimitPerMinute: number, batchSize: number) {
    const maxPossibleBatch = Math.min(batchSize, rateLimitPerMinute);
    const batchesPerMinute = rateLimitPerMinute / maxPossibleBatch;
    const delayPerBatch = (60 / batchesPerMinute) * 1000;
    return { maxPossibleBatch, batchesPerMinute, delayPerBatch };
  }

  // move to utility
  private async delay(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
