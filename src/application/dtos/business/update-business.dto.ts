import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  pesapalConsumerKey?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  pesapalConsumerSecret?: string;
}
