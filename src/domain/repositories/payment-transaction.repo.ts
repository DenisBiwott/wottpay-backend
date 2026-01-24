import { PaymentTransaction } from '../entities/payment-transaction.entity';

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
}
