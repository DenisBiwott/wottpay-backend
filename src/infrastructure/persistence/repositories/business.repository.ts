// Businss repository
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business as BusinessDocument } from 'src/infrastructure/persistence/schemas/businesses.schema';
import { Business } from 'src/domain/entities/business.entity';
import { IBusinessRepository } from 'src/domain/repositories/business.repo';

@Injectable()
export class BusinessRepository implements IBusinessRepository {
  constructor(
    @InjectModel(BusinessDocument.name)
    private businessModel: Model<BusinessDocument>,
  ) {}

  async create(business: Business): Promise<Business> {
    const createdBusiness = new this.businessModel(business);
    const savedBusiness = await createdBusiness.save();
    return this.toDomainEntity(savedBusiness);
  }

  async findById(id: string): Promise<Business | null> {
    const businessDoc = await this.businessModel.findById(id).exec();
    return businessDoc ? this.toDomainEntity(businessDoc) : null;
  }

  async save(business: Business): Promise<void> {
    const businessDoc = new this.businessModel(business);
    await businessDoc.save();
  }

  async update(id: string, business: Partial<Business>): Promise<void> {
    await this.businessModel.findByIdAndUpdate(id, business).exec();
  }

  private toDomainEntity(businessDoc: BusinessDocument): Business {
    return new Business(
      businessDoc._id.toString(),
      businessDoc.name,
      businessDoc.pesapalConsumerKey,
      businessDoc.pesapalConsumerSecret,
    );
  }
}
