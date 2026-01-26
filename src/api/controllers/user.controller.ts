import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from 'src/application/use-cases/users/user.service';
import { CreateUserDto } from 'src/application/dtos/user/create-user.dto';
import { UpdateUserDto } from 'src/application/dtos/user/update-user.dto';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from 'src/infrastructure/security/roles.guard';
import { Roles } from 'src/infrastructure/security/decorators';
import { UserRole } from 'src/domain/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/infrastructure/security/jwt.strategy';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (createUserDto.businessId !== req.user.businessId) {
      throw new ForbiddenException(
        'Cannot create users for a different business',
      );
    }
    return this.userService.create(createUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.userService.findAllByBusiness(
      req.user.businessId,
      pageNum,
      limitNum,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = await this.userService.findById(id);
    if (user.businessId !== req.user.businessId) {
      throw new ForbiddenException('Cannot access users from another business');
    }
    return user;
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = await this.userService.findById(id);
    if (user.businessId !== req.user.businessId) {
      throw new ForbiddenException('Cannot update users from another business');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const user = await this.userService.findById(id);
    if (user.businessId !== req.user.businessId) {
      throw new ForbiddenException('Cannot delete users from another business');
    }
    await this.userService.delete(id);
  }
}
