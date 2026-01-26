import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from 'src/infrastructure/persistence/schemas/user.schema';
import {
  Business,
  BusinessSchema,
} from 'src/infrastructure/persistence/schemas/businesses.schema';
import { UserRepository } from 'src/infrastructure/persistence/repositories/user.respository';
import { BusinessRepository } from 'src/infrastructure/persistence/repositories/business.repository';
import { UserService } from 'src/application/use-cases/users/user.service';
import { UserController } from 'src/api/controllers/user.controller';
import { EventLogModule } from './event-log.module';

@Module({
  imports: [
    forwardRef(() => EventLogModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IBusinessRepository',
      useClass: BusinessRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
