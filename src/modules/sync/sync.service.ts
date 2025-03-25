import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiService } from './api.service';

@Injectable()
export class SyncService {
  private productIds: number[];
  /*
  14 - Mon , Tue , Wed
  15 - Sun
  */ 

  constructor(private readonly apiService: ApiService) {
    this.productIds = this.getProductIds(); 
  }

  fetchInventroyDataForToday() {

  }

  private getProductIds(){
    return (process.env.PRODUCT_IDS ?? '')
    .split(',')
    .map((productId) => Number(productId.trim()))
    .filter((id) => !isNaN(id));
  }
}
