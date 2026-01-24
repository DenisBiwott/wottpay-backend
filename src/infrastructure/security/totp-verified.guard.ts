import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRE_TOTP_KEY = 'requireTotp';

@Injectable()
export class TotpVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireTotp = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TOTP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireTotp) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.totpVerified === false) {
      throw new ForbiddenException('TOTP verification required');
    }

    return true;
  }
}
