import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';

class PriceDto {
  @IsInt()
  finalPrice: number;

  @IsInt()
  originalPrice: number;

  @IsString()
  currencyCode: string;
}

export class PaxAvailibilityDto {
  @Expose()
  @IsOptional()
  @IsString()
  slotId:string

  @Expose()
  @IsInt()
  remaining: string;

  @Expose()
  @IsString()
  type: string;

  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;



  @Expose()
  @IsOptional()
  @IsInt()
  min:number

  @Expose()
  @IsOptional()
  @IsInt()
  max:number

  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;
}

export class SlotDto {
  
  @Expose()
  @IsString()
  providerSlotId:string

  @Expose()
  @IsString()
  startTime: string;

  @Expose()
  @IsString()
  startDate: string;

  @Expose()
  @IsInt()
  remaining: number;

  @Expose()
  @IsInt()
  productId:number

  // @IsOptional()
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => PaxAvailibilityDto)
  // paxAvailibility?: PaxAvailibilityDto[];
}
