import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from 'src/infrastructure/persistence/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from 'src/infrastructure/persistence/schemas/refresh-token.schema';
import { UserRepository } from 'src/infrastructure/persistence/repositories/user.respository';
import { RefreshTokenRepository } from 'src/infrastructure/persistence/repositories/refresh-token.repository';
import { AuthProvider } from 'src/infrastructure/security/auth.provider';
import { JwtStrategy } from 'src/infrastructure/security/jwt.strategy';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { TotpVerifiedGuard } from 'src/infrastructure/security/totp-verified.guard';
import { AuthService } from 'src/application/use-cases/auth/auth.service';
import { AuthController } from 'src/api/controllers/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('JWT_SECRET') || 'default-secret';
        const expiresInRaw = configService.get<string>('JWT_EXPIRES_IN');
        const expiresIn = expiresInRaw
          ? parseInt(expiresInRaw.trim(), 10)
          : 3600;
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    TotpVerifiedGuard,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IRefreshTokenRepository',
      useClass: RefreshTokenRepository,
    },
    {
      provide: 'IAuthProvider',
      useClass: AuthProvider,
    },
  ],
  exports: [AuthService, JwtAuthGuard, TotpVerifiedGuard, 'IAuthProvider'],
})
export class AuthModule {}
