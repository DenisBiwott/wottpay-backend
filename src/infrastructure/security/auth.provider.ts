import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import { IAuthProvider } from 'src/domain/services/iauth.provider';

@Injectable()
export class AuthProvider implements IAuthProvider {
  private totp: TOTP;

  constructor(private readonly jwtService: JwtService) {
    this.totp = new TOTP({
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
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
    const result = await this.totp.verify(token, { secret, epochTolerance: 30 });
    return result.valid;
  }

  generateTOTPSecret(): string {
    return this.totp.generateSecret();
  }

  generateTOTPUri(secret: string, email: string, issuer: string): string {
    return this.totp.toURI({ secret, label: email, issuer });
  }
}
