import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { TransactionFilters } from '../interfaces/transaction-filters.interface';
import { PesapalTransactionStatus } from '../enums/pesapal-transaction-status.enum';

export interface IPaymentTransactionRepository {
  save(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  findById(id: string): Promise<PaymentTransaction | null>;
  findByOrderTrackingId(
    orderTrackingId: string,
  ): Promise<PaymentTransaction | null>;
  findByPaymentLinkId(paymentLinkId: string): Promise<PaymentTransaction[]>;
  findByMerchantReference(
    merchantReference: string,
  ): Promise<PaymentTransaction | null>;
  update(id: string, transaction: Partial<PaymentTransaction>): Promise<void>;
  findByBusinessId(
    businessId: string,
    filters?: TransactionFilters,
  ): Promise<PaymentTransaction[]>;
  findByUserIdAndBusinessId(
    userId: string,
    businessId: string,
    filters?: TransactionFilters,
  ): Promise<PaymentTransaction[]>;
  sumAmountByBusinessId(
    businessId: string,
    status?: PesapalTransactionStatus,
  ): Promise<number>;
}
