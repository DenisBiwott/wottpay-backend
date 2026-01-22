// User repository
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User as UserDocument } from 'src/infrastructure/persistence/schemas/user.schema';
import { User } from 'src/domain/entities/user.entity';
import { UserRole } from 'src/domain/enums/user-role.enum';
import { IUserRepository } from 'src/domain/repositories/user.repo';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(user: User): Promise<User> {
    const createdUser = new this.userModel(user);
    const savedUser = await createdUser.save();
    return this.toDomainEntity(savedUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ email }).exec();
    return userDoc ? this.toDomainEntity(userDoc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const userDoc = await this.userModel.findById(id).exec();
    return userDoc ? this.toDomainEntity(userDoc) : null;
  }

  async save(user: User): Promise<void> {
    const userDoc = new this.userModel(user);
    await userDoc.save();
  }

  async update(id: string, user: Partial<User>): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, user).exec();
  }

  private toDomainEntity(userDoc: UserDocument): User {
    return new User(
      userDoc._id.toString(),
      userDoc.email,
      userDoc.passwordHash,
      userDoc.role as UserRole,
      userDoc.totpSecret,
      userDoc.isTotpEnabled,
    );
  }
}
