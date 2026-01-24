import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import {
  PaymentLink,
  PaymentLinkSchema,
} from 'src/infrastructure/persistence/schemas/payment-link.schema';
import {
  IpnRegistration,
  IpnRegistrationSchema,
} from 'src/infrastructure/persistence/schemas/ipn-registration.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from 'src/infrastructure/persistence/schemas/payment-transaction.schema';
import {
  Business,
  BusinessSchema,
} from 'src/infrastructure/persistence/schemas/businesses.schema';
import { PaymentLinkRepository } from 'src/infrastructure/persistence/repositories/payment-link.repository';
import { IpnRegistrationRepository } from 'src/infrastructure/persistence/repositories/ipn-registration.repository';
import { PaymentTransactionRepository } from 'src/infrastructure/persistence/repositories/payment-transaction.repository';
import { BusinessRepository } from 'src/infrastructure/persistence/repositories/business.repository';
import { PesapalProvider } from 'src/infrastructure/external/pesapal/pesapal.provider';
import { PaymentService } from 'src/application/use-cases/payments/payment.service';
import { TokenCacheService } from 'src/application/use-cases/payments/token-cache.service';
import { PaymentController } from 'src/api/controllers/payment.controller';
import { EncryptionService } from 'src/infrastructure/security/encryption.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: PaymentLink.name, schema: PaymentLinkSchema },
      { name: IpnRegistration.name, schema: IpnRegistrationSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    TokenCacheService,
    EncryptionService,
    {
      provide: 'IPaymentLinkRepository',
      useClass: PaymentLinkRepository,
    },
    {
      provide: 'IIpnRegistrationRepository',
      useClass: IpnRegistrationRepository,
    },
    {
      provide: 'IPaymentTransactionRepository',
      useClass: PaymentTransactionRepository,
    },
    {
      provide: 'IBusinessRepository',
      useClass: BusinessRepository,
    },
    {
      provide: 'IPesapalProvider',
      useClass: PesapalProvider,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
