import { Injectable, Inject } from '@nestjs/common';
import type { IPaymentTransactionRepository } from 'src/domain/repositories/payment-transaction.repo';
import type { IPaymentLinkRepository } from 'src/domain/repositories/payment-link.repo';
import { PesapalTransactionStatus } from 'src/domain/enums/pesapal-transaction-status.enum';
import { PaymentStatus } from 'src/domain/enums/payment-status.enum';
import { InsightsResponseDto } from 'src/application/dtos/insights/insights-response.dto';

@Injectable()
export class InsightsService {
  constructor(
    @Inject('IPaymentTransactionRepository')
    private readonly transactionRepo: IPaymentTransactionRepository,
    @Inject('IPaymentLinkRepository')
    private readonly paymentLinkRepo: IPaymentLinkRepository,
  ) {}

  async getBusinessInsights(businessId: string): Promise<InsightsResponseDto> {
    const [totalReceived, pendingCount, paidCount] = await Promise.all([
      this.transactionRepo.sumAmountByBusinessId(
        businessId,
        PesapalTransactionStatus.COMPLETED,
      ),
      this.paymentLinkRepo.countByBusinessIdAndStatus(
        businessId,
        PaymentStatus.ACTIVE,
      ),
      this.paymentLinkRepo.countByBusinessIdAndStatus(
        businessId,
        PaymentStatus.COMPLETED,
      ),
    ]);

    return {
      totalAmountReceived: totalReceived,
      pendingPaymentRequests: pendingCount,
      paidPaymentRequests: paidCount,
    };
  }
}
