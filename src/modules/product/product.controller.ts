import { Controller, Get, Post } from '@nestjs/common';
import { Body, Param, Patch } from '@nestjs/common/decorators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ProductService } from './product.service';

@Controller({path:'product',version:'1'})
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

  @Patch('/update/:id')
  async updateProduct(@Param('id') id :number,@Body() product: Prisma.ProductUpdateInput) {
    return this.productService.updateProduct(product,{id:Number(id)})
  }
}
