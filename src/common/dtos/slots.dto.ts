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

class PaxAvailibilityDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;
}

export class CreateSlotDto {
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
