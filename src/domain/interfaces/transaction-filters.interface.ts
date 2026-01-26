import { PesapalTransactionStatus } from '../enums/pesapal-transaction-status.enum';

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  status?: PesapalTransactionStatus;
  skip?: number;
  limit?: number;
}
