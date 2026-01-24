import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';
import { REQUIRE_TOTP_KEY } from './totp-verified.guard';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const RequireTotp = () => SetMetadata(REQUIRE_TOTP_KEY, true);
