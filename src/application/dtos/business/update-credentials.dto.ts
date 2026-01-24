import { IsString, MinLength } from 'class-validator';

export class UpdateCredentialsDto {
  @IsString()
  @MinLength(1)
  pesapalConsumerKey: string;

  @IsString()
  @MinLength(1)
  pesapalConsumerSecret: string;
}
