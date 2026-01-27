import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from 'src/application/use-cases/businesses/business.service';
import { CreateBusinessDto } from 'src/application/dtos/business/create-business.dto';
import { UpdateBusinessDto } from 'src/application/dtos/business/update-business.dto';
import { UpdateCredentialsDto } from 'src/application/dtos/business/update-credentials.dto';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { Public } from 'src/infrastructure/security/decorators';

@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Public()
  @Post()
  async create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.businessService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.businessService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessService.update(id, updateBusinessDto);
  }

  @Patch(':id/credentials')
  async updateCredentials(
    @Param('id') id: string,
    @Body() updateCredentialsDto: UpdateCredentialsDto,
  ) {
    return this.businessService.updateCredentials(id, updateCredentialsDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.businessService.delete(id);
  }
}
