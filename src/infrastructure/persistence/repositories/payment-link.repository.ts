import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentLink as PaymentLinkDocument } from 'src/infrastructure/persistence/schemas/payment-link.schema';
import { PaymentLink } from 'src/domain/entities/payment-link.entity';
import { IPaymentLinkRepository } from 'src/domain/repositories/payment-link.repo';
import { PaymentStatus } from 'src/domain/enums/payment-status.enum';

@Injectable()
export class PaymentLinkRepository implements IPaymentLinkRepository {
  constructor(
    @InjectModel(PaymentLinkDocument.name)
    private paymentLinkModel: Model<PaymentLinkDocument>,
  ) {}

  async save(link: PaymentLink): Promise<PaymentLink> {
    const doc = new this.paymentLinkModel({
      merchantRef: link.merchantRef,
      trackingId: link.trackingId,
      businessId: link.businessId,
      amount: link.amount,
      currency: link.currency,
      status: link.status,
      redirectUrl: link.redirectUrl,
      description: link.description,
      callbackUrl: link.callbackUrl,
      notificationId: link.notificationId,
      customerEmail: link.customerEmail,
      customerPhone: link.customerPhone,
      customerFirstName: link.customerFirstName,
      customerLastName: link.customerLastName,
      accountNumber: link.accountNumber,
    });
    const savedDoc = await doc.save();
    return this.toDomainEntity(savedDoc);
  }

  async findByReference(merchantRef: string): Promise<PaymentLink | null> {
    const doc = await this.paymentLinkModel.findOne({ merchantRef }).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async findByTrackingId(trackingId: string): Promise<PaymentLink | null> {
    const doc = await this.paymentLinkModel.findOne({ trackingId }).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async findById(id: string): Promise<PaymentLink | null> {
    const doc = await this.paymentLinkModel.findById(id).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async updateStatus(trackingId: string, status: string): Promise<void> {
    await this.paymentLinkModel.updateOne({ trackingId }, { status }).exec();
  }

  async update(id: string, link: Partial<PaymentLink>): Promise<void> {
    await this.paymentLinkModel.findByIdAndUpdate(id, link).exec();
  }

  async findAllByBusiness(businessId: string): Promise<PaymentLink[]> {
    const docs = await this.paymentLinkModel
      .find({ businessId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  private toDomainEntity(doc: PaymentLinkDocument): PaymentLink {
    return new PaymentLink(
      doc._id.toString(),
      doc.merchantRef,
      doc.trackingId,
      doc.businessId,
      doc.amount,
      doc.currency,
      doc.status as PaymentStatus,
      doc.createdAt,
      doc.updatedAt,
      doc.redirectUrl,
      doc.description,
      doc.callbackUrl,
      doc.notificationId,
      doc.customerEmail,
      doc.customerPhone,
      doc.customerFirstName,
      doc.customerLastName,
      doc.accountNumber,
    );
  }
}
