import { PaymentLink } from 'src/domain/entities/payment-link.entity';
import { PaymentTransaction } from 'src/domain/entities/payment-transaction.entity';
import {
  PesapalTransactionStatus,
  PesapalTransactionStatusLabels,
} from 'src/domain/enums/pesapal-transaction-status.enum';

export class TransactionDetailsDto {
  id: string;
  orderTrackingId: string;
  merchantReference: string;
  paymentMethod: string;
  confirmationCode: string;
  statusCode: PesapalTransactionStatus;
  statusLabel: string;
  statusMessage: string;
  amount: number;
  currency: string;
  paymentAccount: string;
  createdAt: Date;

  static fromEntity(entity: PaymentTransaction): TransactionDetailsDto {
    const dto = new TransactionDetailsDto();
    dto.id = entity.id;
    dto.orderTrackingId = entity.orderTrackingId;
    dto.merchantReference = entity.merchantReference;
    dto.paymentMethod = entity.paymentMethod;
    dto.confirmationCode = entity.confirmationCode;
    dto.statusCode = entity.statusCode;
    dto.statusLabel =
      PesapalTransactionStatusLabels[entity.statusCode] || 'UNKNOWN';
    dto.statusMessage = entity.statusMessage;
    dto.amount = entity.amount;
    dto.currency = entity.currency;
    dto.paymentAccount = entity.paymentAccount;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}

export class PaymentLinkWithTransactionDto {
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
  customerEmail: string;
  customerPhone: string;
  customerFirstName: string;
  customerLastName: string;
  createdAt: Date;
  updatedAt: Date;
  transaction: TransactionDetailsDto | null;

  static fromEntities(
    paymentLink: PaymentLink,
    transaction: PaymentTransaction | null,
  ): PaymentLinkWithTransactionDto {
    const dto = new PaymentLinkWithTransactionDto();
    dto.id = paymentLink.id;
    dto.merchantRef = paymentLink.merchantRef;
    dto.trackingId = paymentLink.trackingId;
    dto.businessId = paymentLink.businessId;
    dto.userId = paymentLink.userId;
    dto.amount = paymentLink.amount;
    dto.currency = paymentLink.currency;
    dto.status = paymentLink.status;
    dto.redirectUrl = paymentLink.redirectUrl || '';
    dto.description = paymentLink.description || '';
    dto.callbackUrl = paymentLink.callbackUrl || '';
    dto.customerEmail = paymentLink.customerEmail || '';
    dto.customerPhone = paymentLink.customerPhone || '';
    dto.customerFirstName = paymentLink.customerFirstName || '';
    dto.customerLastName = paymentLink.customerLastName || '';
    dto.createdAt = paymentLink.createdAt;
    dto.updatedAt = paymentLink.updatedAt;
    dto.transaction = transaction
      ? TransactionDetailsDto.fromEntity(transaction)
      : null;
    return dto;
  }
}
