import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Business,
  BusinessSchema,
} from 'src/infrastructure/persistence/schemas/businesses.schema';
import { BusinessRepository } from 'src/infrastructure/persistence/repositories/business.repository';
import { BusinessService } from 'src/application/use-cases/businesses/business.service';
import { BusinessController } from 'src/api/controllers/business.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    {
      provide: 'IBusinessRepository',
      useClass: BusinessRepository,
    },
  ],
  exports: [BusinessService],
})
export class BusinessModule {}
