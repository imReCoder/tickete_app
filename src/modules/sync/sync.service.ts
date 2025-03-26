import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiService } from './api.service';
import { ProductService } from '../product/product.service';
import * as dayjs from 'dayjs';
import { QueueService } from './queue.service';

@Injectable()
export class SyncService {
  private readonly API_BATCH_SIZE;
  private readonly RATE_LIMIT_PER_MINUTE;

  private readonly rateLimitInfo;

  constructor(
    private readonly productService: ProductService,
    private readonly apiService: ApiService,
    private queueService: QueueService,
  ) {
    this.API_BATCH_SIZE = process.env.API_BATCH_SIZE || 5;
    this.RATE_LIMIT_PER_MINUTE = process.env.RATE_LIMIT_PER_MINUTE;
    console.debug(
      `[Syn Info] - Rate Limit : ${this.RATE_LIMIT_PER_MINUTE} | Batch Size : ${this.API_BATCH_SIZE}`,
    );
    this.rateLimitInfo = this.calculateRateLimit(
      this.RATE_LIMIT_PER_MINUTE,
      this.API_BATCH_SIZE,
    );
    this.processNextTask();
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

      // console.log(
      //   `\nDate: ${formattedDate} (${dayName}) - ${availableProducts.length} products available`,
      // );

      if (!availableProducts.length) {
        console.debug(
          `\nSkipping for Date: ${formattedDate} (${dayName}) - ${availableProducts.length} products available`,
        );
        continue;
      }

     
      await this.addProductBatchesInQueue(availableProducts, date);
    }
  }

  public async addProductBatchesInQueue(products: any[], date: dayjs.Dayjs) {
  

    const dayName = date.format('ddd');
    const formattedDate = date.format('YYYY-MM-DD');
    console.debug(
      `\nAdding for Date: ${formattedDate} (${dayName}) - ${products.length} products available`,
    );

    const batchSize = this.rateLimitInfo.maxPossibleBatch;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchNumber = i / batchSize + 1;
      const taskId = this.getTaskId(formattedDate,batchNumber);
     console.debug(`Add Batch: ${batchNumber} | Products : ${batch.length}`)
      this.queueService.addToQueue(
        taskId,
        { batch, date:formattedDate },
      );
    }
  }

  
  processNextTask() {
    this.queueService.getNextTask().then(async (task) => {
      console.log(`\nProcessing task : ${task.taskId}`);
      await this._processBatch(task);
      this.processNextTask();
    });
  }

  private async _processBatch(task) {
    const { batch, date } = task.payload;
    const batchResults = await Promise.allSettled(
      batch.map((product) =>
        this.apiService.fetchInventoryData(product.productId, date),
      ),
    );

    const successfulData = batchResults
      .filter((result) => result.status === 'fulfilled')
      .map((result: any) => result.value);

    console.log(
      `Processed Task Id : ${task.taskId} | Fetched : ${successfulData.length} data , Total : ${batch.length}`,
    );
    await this.delay(this.rateLimitInfo.delayPerBatch);
  }

  private calculateRateLimit(rateLimitPerMinute: number, batchSize: number) {
    const maxPossibleBatch = Math.min(batchSize, rateLimitPerMinute);
    const batchesPerMinute = Math.floor(rateLimitPerMinute / maxPossibleBatch);
    const delayPerBatch = (60 / batchesPerMinute) * 1000;
    return { maxPossibleBatch, batchesPerMinute, delayPerBatch };
  }

  // move to utility
  private async delay(ms) {
    console.debug(`Waiting for ${ms}ms.....`);
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getTaskId(dateString:string,batchNumber:number){
    return `${dateString}-B${batchNumber}`
  }
}