import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InsightsService } from 'src/application/use-cases/insights/insights.service';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from 'src/infrastructure/security/roles.guard';
import { Roles } from 'src/infrastructure/security/decorators';
import { UserRole } from 'src/domain/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/infrastructure/security/jwt.strategy';

@Controller('insights')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get()
  async getInsights(@Request() req: AuthenticatedRequest) {
    return this.insightsService.getBusinessInsights(req.user.businessId);
  }
}
