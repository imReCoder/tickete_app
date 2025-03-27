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
    // console.log("Date string ",dateString)
    // if(dateString == "2025-03-31"){
    //   return of({data:mockData31.map(d=>({...d,providerSlotId:`${d.providerSlotId}-${productId}`})),productId}); 
    // }else if(dateString=="2025-04-01"){
    //   return of({data:mockData01.map(d=>({...d,providerSlotId:`${d.providerSlotId}-${productId}`})),productId}); 

    // }
    // else if(dateString == "2025-04-02"){
    //   return of({data:mockData02.map(d=>({...d,providerSlotId:`${d.providerSlotId}-${productId}`})),productId}); 
    // }else{
    //   return of({data:[],productId})
    // }
if(productId==14){
  return this.httpService.get(url,config).pipe(map(res=>res.data),map(data=>({data:data[0]?[data[0]]:[],productId,date:dateString})));
}
    return this.httpService.get(url,config).pipe(map(res=>res.data),map(data=>({data,productId,date:dateString})));
  }
}
