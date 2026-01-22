import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { IBusinessRepository } from 'src/domain/repositories/business.repo';
import { Business } from 'src/domain/entities/business.entity';
import { CreateBusinessDto } from 'src/application/dtos/business/create-business.dto';
import { UpdateBusinessDto } from 'src/application/dtos/business/update-business.dto';
import { BusinessResponseDto } from 'src/application/dtos/business/business-response.dto';

interface BusinessUpdateData {
  name?: string;
  pesapalConsumerKey?: string;
  pesapalConsumerSecret?: string;
}

@Injectable()
export class BusinessService {
  constructor(
    @Inject('IBusinessRepository')
    private readonly businessRepository: IBusinessRepository,
  ) {}

  async create(dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    const existingBusiness = await this.businessRepository.findByName(dto.name);
    if (existingBusiness) {
      throw new ConflictException('Business with this name already exists');
    }

    const business = new Business(
      undefined as any,
      dto.name,
      dto.pesapalConsumerKey,
      dto.pesapalConsumerSecret,
    );

    const createdBusiness = await this.businessRepository.create(business);
    return BusinessResponseDto.fromEntity(createdBusiness);
  }

  async findById(id: string): Promise<BusinessResponseDto> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return BusinessResponseDto.fromEntity(business);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: BusinessResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [businesses, total] = await Promise.all([
      this.businessRepository.findAll({ skip, limit }),
      this.businessRepository.count(),
    ]);

    return {
      data: businesses.map((business) =>
        BusinessResponseDto.fromEntity(business),
      ),
      total,
      page,
      limit,
    };
  }

  async update(
    id: string,
    dto: UpdateBusinessDto,
  ): Promise<BusinessResponseDto> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (dto.name && dto.name !== business.name) {
      const existingBusiness = await this.businessRepository.findByName(
        dto.name,
      );
      if (existingBusiness) {
        throw new ConflictException('Business with this name already exists');
      }
    }

    const updateData: BusinessUpdateData = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.pesapalConsumerKey)
      updateData.pesapalConsumerKey = dto.pesapalConsumerKey;
    if (dto.pesapalConsumerSecret)
      updateData.pesapalConsumerSecret = dto.pesapalConsumerSecret;

    await this.businessRepository.update(id, updateData);
    const updatedBusiness = await this.businessRepository.findById(id);
    return BusinessResponseDto.fromEntity(updatedBusiness!);
  }

  async delete(id: string): Promise<void> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    await this.businessRepository.delete(id);
  }
}
