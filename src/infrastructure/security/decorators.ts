import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';
import { REQUIRE_TOTP_KEY } from './totp-verified.guard';
import { ROLES_KEY } from './roles.guard';
import { UserRole } from 'src/domain/enums/user-role.enum';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const RequireTotp = () => SetMetadata(REQUIRE_TOTP_KEY, true);
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
