import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { Observable, map, of } from 'rxjs';
import { join } from 'path';
import { readFileSync } from 'fs';
import {  mockData01, mockData02, mockData31 } from './mock-data';

@Injectable()
export class ApiService {
  private partnerApi;
  private partnerApiToken;

  constructor(private readonly httpService: HttpService) {
    this.partnerApi = process.env.PARTNER_API;
    this.partnerApiToken = process.env.PARTNER_API_TOKEN;
  }

  fetchInventoryData(productId: number, dateString: string): Observable<any> {
    const url = `${this.partnerApi}/${productId}?date=${dateString}`;
    const config: AxiosRequestConfig = {
      headers: {
        'x-auth-token': this.partnerApiToken,
      },
    };
    console.log("Date string ",dateString)
    if(dateString == "2025-03-31"){
      return of({data:mockData31,productId}); 
    }else if(dateString=="2025-04-01"){
      return of({data:mockData01,productId}); 

    }
    else if(dateString == "2025-04-02"){
      return of({data:mockData02,productId}); 
    }else{
      return of({data:[],productId})
    }

    return this.httpService.get(url, config).pipe(map(res=>res.data),map(data=>({data,productId})));
  }
}
