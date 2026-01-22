import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from 'src/application/dtos/create-payment.dto';
import { PaymentLink } from 'src/domain/entities/payment-link.entity';
import { PaymentStatus } from 'src/domain/enums/payment-status.enum';
import * as businessRepo from 'src/domain/repositories/business.repo';
import * as paymentLinkRepo from 'src/domain/repositories/payment-link.repo';
import * as ipesapalProvider from 'src/domain/services/ipesapal.provider';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentLinkRepo: paymentLinkRepo.IPaymentLinkRepository,
    private readonly businessRepo: businessRepo.IBusinessRepository,
    private readonly pesapalProvider: ipesapalProvider.IPesapalProvider,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentLink> {
    const business = await this.businessRepo.findById(
      createPaymentDto.businessId,
    );

    if (!business) {
      throw new Error('Business not found');
    }

    const paymentLink = new PaymentLink(
      'generated-id',
      createPaymentDto.merchantRef,
      'generated-tracking-id',
      createPaymentDto.businessId,
      createPaymentDto.amount,
      createPaymentDto.currency,
      PaymentStatus.ACTIVE,
      new Date(),
      new Date(),
    );

    await this.paymentLinkRepo.save(paymentLink);
    return paymentLink;
  }
}
