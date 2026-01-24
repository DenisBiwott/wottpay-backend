import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IpnRegistration as IpnRegistrationDocument } from 'src/infrastructure/persistence/schemas/ipn-registration.schema';
import { IpnRegistration } from 'src/domain/entities/ipn-registration.entity';
import { IIpnRegistrationRepository } from 'src/domain/repositories/ipn-registration.repo';
import { IpnNotificationType } from 'src/domain/enums/ipn-notification-type.enum';

@Injectable()
export class IpnRegistrationRepository implements IIpnRegistrationRepository {
  constructor(
    @InjectModel(IpnRegistrationDocument.name)
    private ipnRegistrationModel: Model<IpnRegistrationDocument>,
  ) {}

  async save(registration: IpnRegistration): Promise<IpnRegistration> {
    const doc = new this.ipnRegistrationModel({
      businessId: registration.businessId,
      ipnId: registration.ipnId,
      url: registration.url,
      notificationType: registration.notificationType,
    });
    const savedDoc = await doc.save();
    return this.toDomainEntity(savedDoc);
  }

  async findById(id: string): Promise<IpnRegistration | null> {
    const doc = await this.ipnRegistrationModel.findById(id).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async findByIpnId(ipnId: string): Promise<IpnRegistration | null> {
    const doc = await this.ipnRegistrationModel.findOne({ ipnId }).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async findByBusinessId(businessId: string): Promise<IpnRegistration[]> {
    const docs = await this.ipnRegistrationModel
      .find({ businessId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findByUrl(url: string): Promise<IpnRegistration | null> {
    const doc = await this.ipnRegistrationModel.findOne({ url }).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ipnRegistrationModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  private toDomainEntity(doc: IpnRegistrationDocument): IpnRegistration {
    return new IpnRegistration(
      doc._id.toString(),
      doc.businessId,
      doc.ipnId,
      doc.url,
      doc.notificationType as IpnNotificationType,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
