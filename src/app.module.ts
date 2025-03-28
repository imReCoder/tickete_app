import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SyncModule } from './modules/sync/sync.module';
import { PrismaModule } from './modules/database/prisma.module';
import { ProductModule } from './modules/product/product.module';
import { ExperienceModule } from './modules/experience/experience.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    SyncModule,
    PrismaModule,
    ProductModule,
    ExperienceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
