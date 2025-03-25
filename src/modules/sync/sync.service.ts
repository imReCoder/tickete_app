import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiService } from './api.service';
import { ProductService } from '../product/product.service';
import * as dayjs from 'dayjs';

@Injectable()
export class SyncService {
  private productIds: number[];
  /*
  14 - Mon , Tue , Wed
  15 - Sun
  */

  constructor(
    private readonly productService: ProductService,
    private readonly apiService: ApiService,
  ) {}

  async syncInventroyDataForToday() {
    this._fetchInventoryForDays(1)
  }

  async syncInventroyDataForNext7Days() {
   this._fetchInventoryForDays(7)
  }

  async syncInventoryDataForNext30Days() {
    this._fetchInventoryForDays(30)
  }

  private async _fetchInventoryForDays(days: number) {
    console.debug(`Fetching for ${days} Days`);
    const products = await this.productService.getAllProducts();
    console.debug(`Total products available: ${products.length}`);

    const today = dayjs();
    const upcomingDays = Array.from({ length: days || 1 }, (_, i) => today.add(i, 'day'));

    upcomingDays.forEach((date) => {
      const dayName = date.format('ddd');
      const formattedDate = date.format('YYYY-MM-DD');

      const availableProducts = products.filter((product) => product.days.includes(dayName));

      console.log(`\nDate: ${formattedDate} (${dayName}) - ${availableProducts.length} products available`);
      availableProducts.forEach((product) => 
        console.log(`Fetching productId - ${product.productId}`)
      );
    });
  }
}
