import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
