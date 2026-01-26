import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from 'src/domain/repositories/user.repo';
import type { IRefreshTokenRepository } from 'src/domain/repositories/refresh-token.repo';
import type { IBusinessRepository } from 'src/domain/repositories/business.repo';
import type { IAuthProvider } from 'src/domain/services/iauth.provider';
import { RefreshToken } from 'src/domain/entities/refresh-token.entity';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { VerifyTotpDto } from 'src/application/dtos/auth/verify-totp.dto';
import { SetupTotpDto } from 'src/application/dtos/auth/setup-totp.dto';
import { RefreshTokenDto } from 'src/application/dtos/auth/refresh-token.dto';
import {
  AuthResponseDto,
  RefreshTokenResponseDto,
  TotpSetupResponseDto,
  TotpVerifyResponseDto,
} from 'src/application/dtos/auth/auth-response.dto';
import { EventLogService } from '../event-logs/event-log.service';
import { EventAction } from 'src/domain/enums/event-action.enum';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject('IBusinessRepository')
    private readonly businessRepository: IBusinessRepository,
    @Inject('IAuthProvider')
    private readonly authProvider: IAuthProvider,
    private readonly eventLogService: EventLogService,
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

    // Fetch the user's business
    const business = await this.businessRepository.findById(user.businessId);
    if (!business) {
      throw new UnauthorizedException('User business not found');
    }

    const requiresTotp = user.isTotpEnabled && !!user.totpSecret;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      totpVerified: !requiresTotp,
    };

    const accessToken = this.authProvider.generateJWT(payload);

    // Generate and store refresh token
    const refreshToken = await this.createRefreshToken(user.id);

    // Log the login event
    await this.eventLogService.logEvent(
      EventAction.USER_LOGIN,
      user.id,
      user.businessId,
      'User',
      user.id,
      { email: user.email, requiresTotp },
    );

    return {
      accessToken,
      refreshToken,
      requiresTotp: requiresTotp,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        business: { id: business.id, name: business.name },
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
      businessId: user.businessId,
      totpVerified: true,
    };

    const accessToken = this.authProvider.generateJWT(payload);

    // Generate new refresh token after TOTP verification
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
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

    // Log TOTP enabled event
    await this.eventLogService.logEvent(
      EventAction.TOTP_ENABLED,
      user.id,
      user.businessId,
      'User',
      user.id,
      { email: user.email },
    );

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

    // Log TOTP disabled event
    await this.eventLogService.logEvent(
      EventAction.TOTP_DISABLED,
      user.id,
      user.businessId,
      'User',
      user.id,
      { email: user.email },
    );

    return { message: 'TOTP disabled successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const business = await this.businessRepository.findById(user.businessId);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      business: business ? { id: business.id, name: business.name } : null,
      isTotpEnabled: user.isTotpEnabled,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const storedToken = await this.refreshTokenRepository.findByToken(
      dto.refreshToken,
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!storedToken.isValid()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke the old refresh token (rotation)
    await this.refreshTokenRepository.revoke(dto.refreshToken);

    // Generate new access token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      totpVerified: true, // User was already verified
    };
    const accessToken = this.authProvider.generateJWT(payload);

    // Generate new refresh token
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    await this.refreshTokenRepository.revokeAllForUser(userId);

    // Log logout event
    if (user) {
      await this.eventLogService.logEvent(
        EventAction.USER_LOGOUT,
        userId,
        user.businessId,
        'User',
        userId,
        { email: user.email },
      );
    }

    return { message: 'Logged out successfully' };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = this.authProvider.generateRefreshToken();
    const expiresAt = this.authProvider.getRefreshTokenExpiresAt();

    const refreshToken = new RefreshToken(
      '', // ID will be assigned by MongoDB
      token,
      userId,
      expiresAt,
      new Date(),
      false,
    );

    await this.refreshTokenRepository.create(refreshToken);
    return token;
  }
}
