import { PaymentStatus } from '../enums/payment-status.enum';

export interface PaymentLinkFilters {
  startDate?: Date;
  endDate?: Date;
  status?: PaymentStatus;
  skip?: number;
  limit?: number;
}
