import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { EventLogService } from 'src/application/use-cases/event-logs/event-log.service';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from 'src/infrastructure/security/roles.guard';
import { Roles } from 'src/infrastructure/security/decorators';
import { UserRole } from 'src/domain/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/infrastructure/security/jwt.strategy';

@Controller('event-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventLogController {
  constructor(private readonly eventLogService: EventLogService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  async getEventLogs(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.eventLogService.getEventsByBusiness(
      req.user.businessId,
      pageNum,
      limitNum,
    );
  }
}
