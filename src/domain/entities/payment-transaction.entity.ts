import { PesapalTransactionStatus } from '../enums/pesapal-transaction-status.enum';

export class PaymentTransaction {
  constructor(
    public id: string,
    public paymentLinkId: string,
    public userId: string,
    public businessId: string,
    public orderTrackingId: string,
    public merchantReference: string,
    public paymentMethod: string,
    public confirmationCode: string,
    public statusCode: PesapalTransactionStatus,
    public statusMessage: string,
    public amount: number,
    public currency: string,
    public paymentAccount: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
