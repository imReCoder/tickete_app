import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiService } from './api.service';
import { ProductService } from '../product/product.service';
import * as dayjs from 'dayjs';
import { QueueService } from './queue.service';
import { firstValueFrom } from 'rxjs';
import { SlotsService } from '../experience/slots/slots.service';

@Injectable()
export class SyncService {
  private readonly API_BATCH_SIZE;
  private readonly RATE_LIMIT_PER_MINUTE;

  private readonly rateLimitInfo;
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly productService: ProductService,
    private readonly apiService: ApiService,
    private queueService: QueueService,
    private prisma:PrismaService,
    private slotsService:SlotsService
  ) {
    this.API_BATCH_SIZE = process.env.API_BATCH_SIZE || 5;
    this.RATE_LIMIT_PER_MINUTE = process.env.RATE_LIMIT_PER_MINUTE;
    this.logger.log(
      `[Syn Info] - Rate Limit : ${this.RATE_LIMIT_PER_MINUTE} | Batch Size : ${this.API_BATCH_SIZE}`,
    );
    this.rateLimitInfo = this.calculateRateLimit(
      this.RATE_LIMIT_PER_MINUTE,
      this.API_BATCH_SIZE,
    );
    this.processNextBatch();
  }

  //every 15 minutes
  async syncInventroyDataForToday() {
    this._fetchInventoryForDays(1, 0);
  }

  //every 4 hours
  async syncInventroyDataForNext7Days() {
    this._fetchInventoryForDays(7);
  }

  //every day once
  async syncInventoryDataForNext30Days() {
    this._fetchInventoryForDays(30);
  }

  private async _fetchInventoryForDays(
    days: number,
    skipDays: number = 1,
  ): Promise<void> {
    this.logger.warn(`Triggered: Fetching inventory for ${days} days`);

    const products = await this.productService.getAllProducts();
    this.logger.log(`Total products available: ${products.length}`);

    const upcomingDays = this._generateUpcomingDays(days, skipDays);

    for (const date of upcomingDays) {
      await this._processProductsForDate(products, date);
    }
  }

  private _generateUpcomingDays(days: number, skipDays: number): dayjs.Dayjs[] {
    return Array.from({ length: days || 1 }, (_, i) =>
      dayjs().add(i + skipDays, 'day'),
    );
  }

  private async _processProductsForDate(
    products: any[],
    date: dayjs.Dayjs,
  ): Promise<void> {
    const dayName = date.format('ddd');
    const formattedDate = date.format('YYYY-MM-DD');

    const availableProducts = products.filter((product) =>
      product.days.includes(dayName),
    );

    if (availableProducts.length === 0) {
      this.logger.log(
        `Skipping ${formattedDate} (${dayName}) - No products available`,
      );
      return;
    }

    await this._addProductsToQueue(availableProducts, formattedDate);
  }

  private async _addProductsToQueue(
    products: any[],
    formattedDate: string,
  ): Promise<void> {
    for (const product of products) {
      const taskId = this.getTaskId(product.productId, formattedDate);
      this.logger.debug(`Adding product to queue: ${taskId}`);
      this.queueService.addToQueue(taskId, { product, date: formattedDate });
    }
  }

  processNextBatch() {
    this.queueService
      .getNextBatch(this.API_BATCH_SIZE, 3000)
      .then(async (tasks) => {
        console.log(`Processing `, tasks);
        await this._processBatch(tasks);
        this.processNextBatch();
      });
  }

  private async _processBatch(tasks) {
    const batchResults = await Promise.allSettled(
      tasks.map((task) =>firstValueFrom(
        this.apiService.fetchInventoryData(
          task.payload.product.productId,
          task.payload.date,
        )),
      ),
    );

    const successfulData = batchResults
      .filter((result) => result.status === 'fulfilled')
      .map((result: any) => result.value);

    this.logger.log(
      `Processed  | Fetched : ${successfulData.length} data , Total : ${tasks.length} | Remaining : ${this.queueService.getQueueLength()}`,
    );
    console.log("success data ",successfulData);
    await this.syncApiData(successfulData)
    await this.delay(this.rateLimitInfo.delayPerBatch);
  }

  private async syncApiData(apiData:any[]){
  await this.slotsService.bulkUpsertSlots(apiData);
  }

  private calculateRateLimit(rateLimitPerMinute: number, batchSize: number) {
    const maxPossibleBatch = Math.min(batchSize, rateLimitPerMinute);
    const batchesPerMinute = Math.floor(rateLimitPerMinute / maxPossibleBatch);
    const delayPerBatch = (60 / batchesPerMinute) * 1000;
    return { maxPossibleBatch, batchesPerMinute, delayPerBatch };
  }

  // move to utility
  private async delay(ms) {
    this.logger.log(`Waiting for ${ms}ms.....`);
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getTaskId(productId: number, dateString: string) {
    return `${productId}_${dateString}`;
  }
}
