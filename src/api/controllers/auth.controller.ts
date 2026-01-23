import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from 'src/application/use-cases/auth/auth.service';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { VerifyTotpDto } from 'src/application/dtos/auth/verify-totp.dto';
import { SetupTotpDto } from 'src/application/dtos/auth/setup-totp.dto';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { Public } from 'src/infrastructure/security/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('totp/verify')
  async verifyTotp(@Request() req: any, @Body() verifyTotpDto: VerifyTotpDto) {
    return this.authService.verifyTotp(req.user.id, verifyTotpDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('totp/setup')
  async setupTotp(@Request() req: any) {
    return this.authService.setupTotp(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('totp/confirm')
  async confirmTotpSetup(
    @Request() req: any,
    @Body() setupTotpDto: SetupTotpDto,
  ) {
    return this.authService.confirmTotpSetup(req.user.id, setupTotpDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('totp/disable')
  async disableTotp(@Request() req: any, @Body() verifyTotpDto: VerifyTotpDto) {
    return this.authService.disableTotp(req.user.id, verifyTotpDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
