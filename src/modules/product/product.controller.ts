import { Controller, Get, Post } from '@nestjs/common';
import { Body } from '@nestjs/common/decorators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Controller('product')
export class ProductController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllProducts() {
    return await this.prisma.product.findMany();
  }

  @Post('/add')
  async addProduct(@Body() product: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data: product,
    });
  }
}
