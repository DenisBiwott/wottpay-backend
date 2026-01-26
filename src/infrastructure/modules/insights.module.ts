import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentLink,
  PaymentLinkSchema,
} from 'src/infrastructure/persistence/schemas/payment-link.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from 'src/infrastructure/persistence/schemas/payment-transaction.schema';
import { PaymentLinkRepository } from 'src/infrastructure/persistence/repositories/payment-link.repository';
import { PaymentTransactionRepository } from 'src/infrastructure/persistence/repositories/payment-transaction.repository';
import { InsightsService } from 'src/application/use-cases/insights/insights.service';
import { InsightsController } from 'src/api/controllers/insights.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentLink.name, schema: PaymentLinkSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
  ],
  controllers: [InsightsController],
  providers: [
    InsightsService,
    {
      provide: 'IPaymentTransactionRepository',
      useClass: PaymentTransactionRepository,
    },
    {
      provide: 'IPaymentLinkRepository',
      useClass: PaymentLinkRepository,
    },
  ],
  exports: [InsightsService],
})
export class InsightsModule {}
