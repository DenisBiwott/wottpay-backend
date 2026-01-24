import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken as RefreshTokenDocument } from 'src/infrastructure/persistence/schemas/refresh-token.schema';
import { RefreshToken } from 'src/domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from 'src/domain/repositories/refresh-token.repo';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenDocument.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const doc = new this.refreshTokenModel({
      token: refreshToken.token,
      userId: refreshToken.userId,
      expiresAt: refreshToken.expiresAt,
      isRevoked: refreshToken.isRevoked,
    });
    const saved = await doc.save();
    return this.toDomainEntity(saved);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const doc = await this.refreshTokenModel.findOne({ token }).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const docs = await this.refreshTokenModel.find({ userId }).exec();
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async revoke(token: string): Promise<void> {
    await this.refreshTokenModel
      .updateOne({ token }, { isRevoked: true })
      .exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany({ userId }, { isRevoked: true })
      .exec();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.refreshTokenModel
      .deleteMany({ expiresAt: { $lt: new Date() } })
      .exec();
    return result.deletedCount;
  }

  private toDomainEntity(doc: RefreshTokenDocument): RefreshToken {
    return new RefreshToken(
      doc._id.toString(),
      doc.token,
      doc.userId.toString(),
      doc.expiresAt,
      doc.createdAt,
      doc.isRevoked,
    );
  }
}
