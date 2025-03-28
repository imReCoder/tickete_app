import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { Observable, map, of } from 'rxjs';
import { join } from 'path';
import { readFileSync } from 'fs';
import {  mockData01, mockData02, mockData31 } from './mock-data';
import { ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/common/interfaces/configuration.interface';

@Injectable()
export class ApiService {
  private partnerApi;
  private partnerApiToken;

  constructor(private readonly httpService: HttpService,private cs:ConfigService<IConfiguration>) {
    this.partnerApi = this.cs.get<string>('partnerApi')
    this.partnerApiToken = this.cs.get<string>('partnerApiToken')
  }

  fetchInventoryData(productId: number, dateString: string): Observable<any> {
    const url = `${this.partnerApi}/${productId}?date=${dateString}`;
    console.log("url:",url,this.partnerApiToken);
    const config: AxiosRequestConfig = {
      url,
      headers: {
        'x-api-key': this.partnerApiToken,
      },
    };
    return this.httpService.get(url,config).pipe(map(res=>res.data),map(data=>({data,productId,date:dateString})));
  }
}
