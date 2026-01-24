import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import { randomBytes } from 'crypto';
import { IAuthProvider } from 'src/domain/services/iauth.provider';

@Injectable()
export class AuthProvider implements IAuthProvider {
  private totp: TOTP;
  private readonly refreshTokenExpiresInDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Configure TOTP with modern, audited cryptographic implementations:
    // - NobleCryptoPlugin: Uses @noble/hashes for HMAC-SHA1 (required by TOTP RFC 6238)
    // - ScureBase32Plugin: Uses @scure/base for RFC 4648 compliant base32 encoding
    // These plugins replace Node.js crypto module for better cross-platform compatibility
    // and are maintained by the same author as otplib.
    this.totp = new TOTP({
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });

    // Refresh token expiration (default: 7 days)
    const expiresInDays = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
    );
    this.refreshTokenExpiresInDays = expiresInDays
      ? parseInt(expiresInDays, 10)
      : 7;
  }

  generateJWT(payload: object): string {
    return this.jwtService.sign(payload);
  }

  verifyJWT(token: string): object | null {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }

  generateTOTP(secret: string): string {
    return this.totp.generateSecret();
  }

  async verifyTOTP(token: string, secret: string): Promise<boolean> {
    const result = await this.totp.verify(token, {
      secret,
      epochTolerance: 30,
    });
    return result.valid;
  }

  generateTOTPSecret(): string {
    return this.totp.generateSecret();
  }

  generateTOTPUri(secret: string, email: string, issuer: string): string {
    return this.totp.toURI({ secret, label: email, issuer });
  }

  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  getRefreshTokenExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiresInDays);
    return expiresAt;
  }
}
