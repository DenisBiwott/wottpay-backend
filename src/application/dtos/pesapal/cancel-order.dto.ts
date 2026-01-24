import { IsNotEmpty, IsString } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  orderTrackingId: string;
}
