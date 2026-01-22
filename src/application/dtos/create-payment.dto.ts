import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  merchantRef: string;
}
