import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from 'src/domain/repositories/user.repo';
import { User } from 'src/domain/entities/user.entity';
import { UserRole } from 'src/domain/enums/user-role.enum';
import { CreateUserDto } from 'src/application/dtos/user/create-user.dto';
import { UpdateUserDto } from 'src/application/dtos/user/update-user.dto';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';

interface UserUpdateData {
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  isTotpEnabled?: boolean;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = new User(
      undefined as any,
      dto.email,
      passwordHash,
      dto.role,
      undefined,
      false,
    );

    const createdUser = await this.userRepository.create(user);
    return UserResponseDto.fromEntity(createdUser);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.fromEntity(user);
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

    return {
      data: users.map((user) => UserResponseDto.fromEntity(user)),
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

    const updateData: UserUpdateData = {};
    if (dto.email) updateData.email = dto.email;
    if (dto.password)
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    if (dto.role) updateData.role = dto.role;
    if (dto.isTotpEnabled !== undefined)
      updateData.isTotpEnabled = dto.isTotpEnabled;

    await this.userRepository.update(id, updateData);
    const updatedUser = await this.userRepository.findById(id);
    return UserResponseDto.fromEntity(updatedUser!);
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.delete(id);
  }
}
