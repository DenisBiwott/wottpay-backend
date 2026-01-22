import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from 'src/infrastructure/persistence/schemas/user.schema';
import { UserRepository } from 'src/infrastructure/persistence/repositories/user.respository';
import { UserService } from 'src/application/use-cases/users/user.service';
import { UserController } from 'src/api/controllers/user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
