import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiService } from './api.service';
import { ProductService } from '../product/product.service';
import * as dayjs from 'dayjs';
import { QueueService } from './queue.service';
import { firstValueFrom } from 'rxjs';
import { SlotsService } from '../experience/slots/slots.service';
import { ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/common/interfaces/configuration.interface';
import {
  calculateAdjustedDelay,
  delay,
  getTaskId,
} from 'src/common/utils/common.util';
import { IProduct } from 'src/common/interfaces/product.interface';
import { IQueueTask } from 'src/common/interfaces/sync.interface';

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
    private prisma: PrismaService,
    private slotsService: SlotsService,
    private cs: ConfigService<IConfiguration>,
  ) {
    this.API_BATCH_SIZE = this.cs.get<number>('batchSize');
    this.RATE_LIMIT_PER_MINUTE = this.cs.get<number>('rateLimit');
    this.logger.log(
      `Rate Limit : ${this.RATE_LIMIT_PER_MINUTE} | Batch Size : ${this.API_BATCH_SIZE}`,
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

    const products: IProduct[] = await this.productService.getAllProducts();
    this.logger.log(
      `[${days} Day] Total products available: ${products.length}`,
    );

    const upcomingDays = this._generateUpcomingDays(days, skipDays);

    for (const date of upcomingDays) {
      await this._processProductsForDate(products, date, days);
    }
  }

  private async _processProductsForDate(
    products: IProduct[],
    date: dayjs.Dayjs,
    days: number,
  ): Promise<void> {
    const dayName = date.format('ddd');
    const formattedDate = date.format('YYYY-MM-DD');

    const availableProducts = products.filter((product) =>
      product.days.includes(dayName),
    );

    if (availableProducts.length === 0) {
      this.logger.log(
        `[${days} Day] Skipping ${formattedDate} (${dayName}) - No products available`,
      );
      return;
    }

    await this._addProductsToQueue(availableProducts, formattedDate, days);
  }

  private async _addProductsToQueue(
    products: IProduct[],
    formattedDate: string,
    days: number,
  ): Promise<void> {
    for (const product of products) {
      const taskId = getTaskId(product.productId, formattedDate);
      const dayName = dayjs(formattedDate).format('ddd');
      this.logger.debug(
        `[${days} Day] [${dayName}] Adding product to queue: ${taskId}`,
      );
      this.queueService.addToQueue(taskId, { product, date: formattedDate });
    }
  }

  async processNextBatch() {
    while (true) {
      const tasks: IQueueTask[] = await this.queueService.getNextBatch(
        this.API_BATCH_SIZE,
        3000,
      );
  
      if (!tasks.length) {
        this.logger.log('No tasks found, retrying after delay...');
        await delay(2000);
        continue; // Retry without breaking the loop
      }
  
      this.logger.debug(`Processing ${tasks.length} task(s)`);
      const startTime = Date.now();
  
      await this._processBatch(tasks);
      
      const adjustedDelay = calculateAdjustedDelay(startTime, this.rateLimitInfo);
      this.logger.log(`Waiting for ${adjustedDelay}ms.....`);
  
      await delay(adjustedDelay);
    }
  }
  

  private async _processBatch(tasks) {
    const batchResults = await Promise.allSettled(
      tasks.map((task: IQueueTask) =>
        firstValueFrom(
          this.apiService.fetchInventoryData(
            task.payload.product.productId,
            task.payload.date,
          ),
        ),
      ),
    );

    const successfulData = batchResults
      .filter((result) => result.status === 'fulfilled')
      .map((result: any) => result.value);

    this.logger.log(
      `Processed  | Fetched : ${successfulData.length} data , Total : ${tasks.length} | Remaining : ${this.queueService.getQueueLength()}`,
    );
    await this.syncApiData(successfulData);
  }

  private async syncApiData(apiData: any[]) {
    await this.slotsService.bulkUpsertSlots(apiData);
  }

  private _generateUpcomingDays(days: number, skipDays: number): dayjs.Dayjs[] {
    return Array.from({ length: days || 1 }, (_, i) =>
      dayjs().add(i + skipDays, 'day'),
    );
  }

  private calculateRateLimit(rateLimitPerMinute: number, batchSize: number) {
    const maxPossibleBatch = Math.min(batchSize, rateLimitPerMinute);
    const batchesPerMinute = Math.floor(rateLimitPerMinute / maxPossibleBatch);
    const delayPerBatch = (60 / batchesPerMinute) * 1000;
    return { maxPossibleBatch, batchesPerMinute, delayPerBatch };
  }
}
