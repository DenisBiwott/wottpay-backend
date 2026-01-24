import { PesapalTransactionStatusResponse } from 'src/domain/services/ipesapal.provider';

export class TransactionStatusResponseDto {
  paymentMethod: string;
  amount: number;
  createdDate: string;
  confirmationCode: string;
  paymentStatusDescription: string;
  description: string;
  message: string;
  paymentAccount: string;
  callbackUrl: string;
  statusCode: number;
  merchantReference: string;
  currency: string;
  status: string;

  static fromPesapalResponse(
    response: PesapalTransactionStatusResponse,
  ): TransactionStatusResponseDto {
    const dto = new TransactionStatusResponseDto();
    dto.paymentMethod = response.payment_method;
    dto.amount = response.amount;
    dto.createdDate = response.created_date;
    dto.confirmationCode = response.confirmation_code;
    dto.paymentStatusDescription = response.payment_status_description;
    dto.description = response.description;
    dto.message = response.message;
    dto.paymentAccount = response.payment_account;
    dto.callbackUrl = response.call_back_url;
    dto.statusCode = response.status_code;
    dto.merchantReference = response.merchant_reference;
    dto.currency = response.currency;
    dto.status = response.status;
    return dto;
  }
}
