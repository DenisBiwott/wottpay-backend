import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class IpnCallbackDto {
  @IsString()
  @IsNotEmpty()
  OrderTrackingId: string;

  @IsString()
  @IsNotEmpty()
  OrderMerchantReference: string;

  @IsString()
  @IsOptional()
  OrderNotificationType?: string;
}
