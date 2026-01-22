import { PaymentLink } from '../entities/payment-link.entity';

export interface IPaymentLinkRepository {
  save(link: PaymentLink): Promise<void>;
  findByReference(merchantRef: string): Promise<PaymentLink | null>;
  findByTrackingId(trackingId: string): Promise<PaymentLink | null>;
  updateStatus(trackingId: string, status: string): Promise<void>;
  findAllByBusiness(businessId: string): Promise<PaymentLink[]>;
}
