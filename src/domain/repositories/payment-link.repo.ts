import { PaymentLink } from '../entities/payment-link.entity';

export interface IPaymentLinkRepository {
  save(link: PaymentLink): Promise<PaymentLink>;
  findByReference(merchantRef: string): Promise<PaymentLink | null>;
  findByTrackingId(trackingId: string): Promise<PaymentLink | null>;
  findById(id: string): Promise<PaymentLink | null>;
  updateStatus(trackingId: string, status: string): Promise<void>;
  update(id: string, link: Partial<PaymentLink>): Promise<void>;
  findAllByBusiness(businessId: string): Promise<PaymentLink[]>;
}
