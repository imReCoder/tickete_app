import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { Observable } from 'rxjs';

@Injectable()
export class ApiService {
  private partnerApi;
  private partnerApiToken;

  constructor(private readonly httpService: HttpService) {
    this.partnerApi = process.env.PARTNER_API;
    this.partnerApiToken = process.env.PARTNER_API_TOKEN;
  }

  fetchInventoryData( productId: number,dateString: string): Observable<any> {
    const url = `${this.partnerApi}/${productId}?date=${dateString}`;
    const config: AxiosRequestConfig = {
      headers: {
        'x-auth-token': this.partnerApiToken,
      },
    };
    return this.httpService.get('./mock-data.json', config);
 
    return this.httpService.get(url, config);
  }
}
