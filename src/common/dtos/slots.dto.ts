import { Type } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
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
  @IsString()
  startTime: string;

  @IsString()
  startDate: string;

  @IsInt()
  remaining: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaxAvailibilityDto)
  paxAvailibility?: PaxAvailibilityDto[];
}
