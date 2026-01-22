import { IsString, MinLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  pesapalConsumerKey: string;

  @IsString()
  @MinLength(1)
  pesapalConsumerSecret: string;
}
