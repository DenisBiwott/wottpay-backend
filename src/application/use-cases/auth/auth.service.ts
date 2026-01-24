import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from 'src/domain/repositories/user.repo';
import type { IAuthProvider } from 'src/domain/services/iauth.provider';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { VerifyTotpDto } from 'src/application/dtos/auth/verify-totp.dto';
import { SetupTotpDto } from 'src/application/dtos/auth/setup-totp.dto';
import {
  AuthResponseDto,
  TotpSetupResponseDto,
  TotpVerifyResponseDto,
} from 'src/application/dtos/auth/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IAuthProvider')
    private readonly authProvider: IAuthProvider,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare user passwords
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Entity / business rules on what's required for login
    if (!user.canLogin()) {
      throw new UnauthorizedException('Account is not properly configured');
    }

    const requiresTotp = user.isTotpEnabled && !!user.totpSecret;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      totpVerified: !requiresTotp,
    };

    const accessToken = this.authProvider.generateJWT(payload);

    return {
      accessToken,
      requiresTotp: requiresTotp,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyTotp(
    userId: string,
    dto: VerifyTotpDto,
  ): Promise<TotpVerifyResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isTotpEnabled || !user.totpSecret) {
      throw new BadRequestException('TOTP is not enabled for this user');
    }

    const isValid = await this.authProvider.verifyTOTP(
      dto.code,
      user.totpSecret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      totpVerified: true,
    };

    const accessToken = this.authProvider.generateJWT(payload);

    return {
      accessToken,
      message: 'TOTP verified successfully',
    };
  }

  async setupTotp(userId: string): Promise<TotpSetupResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isTotpEnabled) {
      throw new BadRequestException('TOTP is already enabled');
    }

    const secret = this.authProvider.generateTOTPSecret();
    const otpauthUrl = this.authProvider.generateTOTPUri(
      secret,
      user.email,
      'WottPay',
    );

    await this.userRepository.update(user.id, { totpSecret: secret } as any);

    return {
      secret,
      otpauthUrl,
    };
  }

  async confirmTotpSetup(
    userId: string,
    dto: SetupTotpDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.totpSecret) {
      throw new BadRequestException('TOTP setup not initiated');
    }

    if (user.isTotpEnabled) {
      throw new BadRequestException('TOTP is already enabled');
    }

    const isValid = await this.authProvider.verifyTOTP(
      dto.code,
      user.totpSecret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.userRepository.update(user.id, { isTotpEnabled: true } as any);

    return { message: 'TOTP enabled successfully' };
  }

  async disableTotp(
    userId: string,
    dto: VerifyTotpDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isTotpEnabled || !user.totpSecret) {
      throw new BadRequestException('TOTP is not enabled');
    }

    const isValid = await this.authProvider.verifyTOTP(
      dto.code,
      user.totpSecret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.userRepository.update(user.id, {
      isTotpEnabled: false,
      totpSecret: undefined,
    } as any);

    return { message: 'TOTP disabled successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isTotpEnabled: user.isTotpEnabled,
    };
  }
}
