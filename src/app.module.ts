import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './infrastructure/modules/user.module';
import { BusinessModule } from './infrastructure/modules/business.module';
import { AuthModule } from './infrastructure/modules/auth.module';

@Module({
  imports: [
    // Access environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Connect to MongoDB
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/nest',
    ),
    // Feature modules
    AuthModule,
    UserModule,
    BusinessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
