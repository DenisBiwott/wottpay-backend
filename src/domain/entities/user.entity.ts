import { UserRole } from '../enums/user-role.enum';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public passwordHash: string,
    public role: UserRole,
    public totpSecret?: string,
    public isTotpEnabled: boolean = false,
  ) {}

  // Business Rule: A merchant cannot be active without a TOTP secret if enabled
  canLogin(): boolean {
    if (this.isTotpEnabled && !this.totpSecret) return false;
    return true;
  }
}
