import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Business,
  BusinessSchema,
} from 'src/infrastructure/persistence/schemas/businesses.schema';
import {
  User,
  UserSchema,
} from 'src/infrastructure/persistence/schemas/user.schema';
import { BusinessRepository } from 'src/infrastructure/persistence/repositories/business.repository';
import { UserRepository } from 'src/infrastructure/persistence/repositories/user.respository';
import { BusinessService } from 'src/application/use-cases/businesses/business.service';
import { BusinessController } from 'src/api/controllers/business.controller';
import { EncryptionService } from 'src/infrastructure/security/encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    EncryptionService,
    {
      provide: 'IBusinessRepository',
      useClass: BusinessRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: [BusinessService, EncryptionService],
})
export class BusinessModule {}
