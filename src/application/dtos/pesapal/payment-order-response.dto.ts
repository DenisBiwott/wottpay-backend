import { PaymentLink } from 'src/domain/entities/payment-link.entity';

export class PaymentOrderResponseDto {
  id: string;
  merchantRef: string;
  trackingId: string;
  businessId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  redirectUrl: string;
  description: string;
  callbackUrl: string;
  createdAt: Date;

  static fromEntity(entity: PaymentLink): PaymentOrderResponseDto {
    const dto = new PaymentOrderResponseDto();
    dto.id = entity.id;
    dto.merchantRef = entity.merchantRef;
    dto.trackingId = entity.trackingId;
    dto.businessId = entity.businessId;
    dto.userId = entity.userId;
    dto.amount = entity.amount;
    dto.currency = entity.currency;
    dto.status = entity.status;
    dto.redirectUrl = entity.redirectUrl || '';
    dto.description = entity.description || '';
    dto.callbackUrl = entity.callbackUrl || '';
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
