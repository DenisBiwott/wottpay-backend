import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from 'src/domain/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
