import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from 'src/domain/repositories/user.repo';
import type { IBusinessRepository } from 'src/domain/repositories/business.repo';
import { User } from 'src/domain/entities/user.entity';
import { UserRole } from 'src/domain/enums/user-role.enum';
import { CreateUserDto } from 'src/application/dtos/user/create-user.dto';
import { UpdateUserDto } from 'src/application/dtos/user/update-user.dto';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';

interface UserUpdateData {
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  businessId?: string;
  isTotpEnabled?: boolean;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IBusinessRepository')
    private readonly businessRepository: IBusinessRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const business = await this.businessRepository.findById(dto.businessId);
    if (!business) {
      throw new BadRequestException('Business not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = new User(
      undefined as any,
      dto.email,
      passwordHash,
      dto.role,
      dto.businessId,
      undefined,
      false,
    );

    const createdUser = await this.userRepository.create(user);
    return UserResponseDto.fromEntity(createdUser, business);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const business = await this.businessRepository.findById(user.businessId);
    return UserResponseDto.fromEntity(user, business ?? undefined);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, limit }),
      this.userRepository.count(),
    ]);

    // Fetch businesses for all users
    const businessIds = [...new Set(users.map((user) => user.businessId))];
    const businesses = await Promise.all(
      businessIds.map((id) => this.businessRepository.findById(id)),
    );
    const businessMap = new Map(
      businesses.filter((b) => b !== null).map((b) => [b.id, b]),
    );

    return {
      data: users.map((user) =>
        UserResponseDto.fromEntity(user, businessMap.get(user.businessId)),
      ),
      total,
      page,
      limit,
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (dto.businessId) {
      const business = await this.businessRepository.findById(dto.businessId);
      if (!business) {
        throw new BadRequestException('Business not found');
      }
    }

    const updateData: UserUpdateData = {};
    if (dto.email) updateData.email = dto.email;
    if (dto.password)
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    if (dto.role) updateData.role = dto.role;
    if (dto.businessId) updateData.businessId = dto.businessId;
    if (dto.isTotpEnabled !== undefined)
      updateData.isTotpEnabled = dto.isTotpEnabled;

    await this.userRepository.update(id, updateData);
    const updatedUser = await this.userRepository.findById(id);
    const business = await this.businessRepository.findById(
      updatedUser!.businessId,
    );
    return UserResponseDto.fromEntity(updatedUser!, business ?? undefined);
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.delete(id);
  }
}
