import { IsNotEmpty, IsString } from 'class-validator';

export class GetTransactionStatusDto {
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  orderTrackingId: string;
}
