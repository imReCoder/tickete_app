import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts() {
    return await this.prisma.product.findMany();
  }

  async addProduct(product: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data: product,
    });
  }

  async updateProduct(
    product: Prisma.ProductUpdateInput,
    update: Prisma.ProductWhereUniqueInput,
  ) {
    console.debug("Update ",update)
    return this.prisma.product.update({
      data: product,
      where: update,
    });
  }
}
