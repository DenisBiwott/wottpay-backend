import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { IBusinessRepository } from 'src/domain/repositories/business.repo';
import type { IUserRepository } from 'src/domain/repositories/user.repo';
import { Business } from 'src/domain/entities/business.entity';
import { CreateBusinessDto } from 'src/application/dtos/business/create-business.dto';
import { UpdateBusinessDto } from 'src/application/dtos/business/update-business.dto';
import { UpdateCredentialsDto } from 'src/application/dtos/business/update-credentials.dto';
import { BusinessResponseDto } from 'src/application/dtos/business/business-response.dto';
import { EncryptionService } from 'src/infrastructure/security/encryption.service';

interface BusinessUpdateData {
  name?: string;
  pesapalConsumerKey?: string;
  pesapalConsumerSecret?: string;
}

export interface DecryptedCredentials {
  pesapalConsumerKey: string;
  pesapalConsumerSecret: string;
}

@Injectable()
export class BusinessService {
  constructor(
    @Inject('IBusinessRepository')
    private readonly businessRepository: IBusinessRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    const existingBusiness = await this.businessRepository.findByName(dto.name);
    if (existingBusiness) {
      throw new ConflictException('Business with this name already exists');
    }

    const encryptedKey = this.encryptionService.encrypt(dto.pesapalConsumerKey);
    const encryptedSecret = this.encryptionService.encrypt(
      dto.pesapalConsumerSecret,
    );

    const business = new Business(
      undefined as unknown as string,
      dto.name,
      encryptedKey,
      encryptedSecret,
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
    if (dto.pesapalConsumerKey) {
      updateData.pesapalConsumerKey = this.encryptionService.encrypt(
        dto.pesapalConsumerKey,
      );
    }
    if (dto.pesapalConsumerSecret) {
      updateData.pesapalConsumerSecret = this.encryptionService.encrypt(
        dto.pesapalConsumerSecret,
      );
    }

    await this.businessRepository.update(id, updateData);
    const updatedBusiness = await this.businessRepository.findById(id);
    return BusinessResponseDto.fromEntity(updatedBusiness!);
  }

  async updateCredentials(
    id: string,
    dto: UpdateCredentialsDto,
  ): Promise<BusinessResponseDto> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const encryptedKey = this.encryptionService.encrypt(dto.pesapalConsumerKey);
    const encryptedSecret = this.encryptionService.encrypt(
      dto.pesapalConsumerSecret,
    );

    await this.businessRepository.update(id, {
      pesapalConsumerKey: encryptedKey,
      pesapalConsumerSecret: encryptedSecret,
    });

    const updatedBusiness = await this.businessRepository.findById(id);
    return BusinessResponseDto.fromEntity(updatedBusiness!);
  }

  async getDecryptedCredentials(id: string): Promise<DecryptedCredentials> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return {
      pesapalConsumerKey: this.encryptionService.decrypt(
        business.pesapalConsumerKey,
      ),
      pesapalConsumerSecret: this.encryptionService.decrypt(
        business.pesapalConsumerSecret,
      ),
    };
  }

  async delete(id: string): Promise<void> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check for associated users
    const userCount = await this.userRepository.countByBusiness(id);
    if (userCount > 0) {
      throw new ConflictException(
        'Cannot delete business with associated users',
      );
    }

    await this.businessRepository.delete(id);
  }
}
