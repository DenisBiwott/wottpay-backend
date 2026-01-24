import { PaymentStatus } from '../enums/payment-status.enum';

export class PaymentLink {
  constructor(
    public id: string,
    public merchantRef: string,
    public trackingId: string,
    public businessId: string,
    public amount: number,
    public currency: string,
    public status: PaymentStatus,
    public createdAt: Date,
    public updatedAt: Date,
    public redirectUrl?: string,
    public description?: string,
    public callbackUrl?: string,
    public notificationId?: string,
    public customerEmail?: string,
    public customerPhone?: string,
    public customerFirstName?: string,
    public customerLastName?: string,
    public accountNumber?: string,
  ) {}
}
