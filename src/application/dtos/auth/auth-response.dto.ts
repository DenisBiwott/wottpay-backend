import { UserRole } from 'src/domain/enums/user-role.enum';

export class AuthResponseDto {
  accessToken: string;
  requiresTotp: boolean;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export class TotpSetupResponseDto {
  secret: string;
  otpauthUrl: string;
}

export class TotpVerifyResponseDto {
  accessToken: string;
  message: string;
}
