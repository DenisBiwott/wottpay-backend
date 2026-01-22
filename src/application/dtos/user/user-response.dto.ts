import { UserRole } from 'src/domain/enums/user-role.enum';
import { User } from 'src/domain/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  role: UserRole;
  isTotpEnabled: boolean;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.role = user.role;
    dto.isTotpEnabled = user.isTotpEnabled;
    return dto;
  }
}
