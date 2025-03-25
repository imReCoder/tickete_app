import { Controller, Get, Post } from '@nestjs/common';
import { Body } from '@nestjs/common/decorators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProducts() {
    return await this.productService.getAllProducts();
  }

  @Post('/add')
  async addProduct(@Body() product: Prisma.ProductCreateInput) {
    return this.productService.addProduct(product)
  }
}
