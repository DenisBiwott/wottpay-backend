import { IsString, Length } from 'class-validator';

export class SetupTotpDto {
  @IsString()
  @Length(6, 6)
  code: string;
}
