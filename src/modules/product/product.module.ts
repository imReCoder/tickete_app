import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { PrismaModule } from '../database/prisma.module';
import { ProductService } from './product.service';

@Module({
  imports:[PrismaModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports:[ProductService]
})
export class ProductModule {}
