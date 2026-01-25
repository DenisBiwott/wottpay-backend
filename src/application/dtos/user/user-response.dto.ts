import { UserRole } from 'src/domain/enums/user-role.enum';
import { User } from 'src/domain/entities/user.entity';
import { Business } from 'src/domain/entities/business.entity';

export class UserResponseDto {
  id: string;
  email: string;
  role: UserRole;
  businessId: string;
  business?: { id: string; name: string };
  isTotpEnabled: boolean;

  static fromEntity(user: User, business?: Business): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.role = user.role;
    dto.businessId = user.businessId;
    dto.isTotpEnabled = user.isTotpEnabled;
    if (business) {
      dto.business = { id: business.id, name: business.name };
    }
    return dto;
  }
}
