import { UserRole } from 'src/domain/enums/user-role.enum';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  requiresTotp: boolean;
  user: {
    id: string;
    email: string;
    role: UserRole;
    businessId: string;
    business: { id: string; name: string };
  };
}

export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class TotpSetupResponseDto {
  secret: string;
  otpauthUrl: string;
}

export class TotpVerifyResponseDto {
  accessToken: string;
  refreshToken: string;
  message: string;
}
