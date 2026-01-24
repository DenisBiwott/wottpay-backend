import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class RegisterIpnDto {
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsIn(['GET', 'POST'])
  notificationType: 'GET' | 'POST';
}
