import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentTransaction as PaymentTransactionDocument } from 'src/infrastructure/persistence/schemas/payment-transaction.schema';
import { PaymentTransaction } from 'src/domain/entities/payment-transaction.entity';
import { IPaymentTransactionRepository } from 'src/domain/repositories/payment-transaction.repo';
import { PesapalTransactionStatus } from 'src/domain/enums/pesapal-transaction-status.enum';
import { TransactionFilters } from 'src/domain/interfaces/transaction-filters.interface';

interface DateQuery {
  $gte?: Date;
  $lte?: Date;
}

interface TransactionFilterQuery {
  businessId?: string;
  userId?: string;
  statusCode?: PesapalTransactionStatus;
  createdAt?: DateQuery;
}

@Injectable()
export class PaymentTransactionRepository implements IPaymentTransactionRepository {
  constructor(
    @InjectModel(PaymentTransactionDocument.name)
    private paymentTransactionModel: Model<PaymentTransactionDocument>,
  ) {}

  async save(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const doc = new this.paymentTransactionModel({
      paymentLinkId: transaction.paymentLinkId,
      userId: transaction.userId,
      businessId: transaction.businessId,
      orderTrackingId: transaction.orderTrackingId,
      merchantReference: transaction.merchantReference,
      paymentMethod: transaction.paymentMethod,
      confirmationCode: transaction.confirmationCode,
      statusCode: transaction.statusCode,
      statusMessage: transaction.statusMessage,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentAccount: transaction.paymentAccount,
    });
    const savedDoc = await doc.save();
    return this.toDomainEntity(savedDoc);
  }

  async findById(id: string): Promise<PaymentTransaction | null> {
    const doc = await this.paymentTransactionModel.findById(id).exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async findByOrderTrackingId(
    orderTrackingId: string,
  ): Promise<PaymentTransaction | null> {
    const doc = await this.paymentTransactionModel
      .findOne({ orderTrackingId })
      .exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async findByPaymentLinkId(
    paymentLinkId: string,
  ): Promise<PaymentTransaction[]> {
    const docs = await this.paymentTransactionModel
      .find({ paymentLinkId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findByMerchantReference(
    merchantReference: string,
  ): Promise<PaymentTransaction | null> {
    const doc = await this.paymentTransactionModel
      .findOne({ merchantReference })
      .exec();
    return doc ? this.toDomainEntity(doc) : null;
  }

  async update(
    id: string,
    transaction: Partial<PaymentTransaction>,
  ): Promise<void> {
    await this.paymentTransactionModel
      .findByIdAndUpdate(id, transaction)
      .exec();
  }

  async findByBusinessId(
    businessId: string,
    filters?: TransactionFilters,
  ): Promise<PaymentTransaction[]> {
    const query = this.buildFilterQuery({ businessId }, filters);
    const docs = await this.paymentTransactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filters?.skip || 0)
      .limit(filters?.limit || 50)
      .exec();
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findByUserIdAndBusinessId(
    userId: string,
    businessId: string,
    filters?: TransactionFilters,
  ): Promise<PaymentTransaction[]> {
    const query = this.buildFilterQuery({ userId, businessId }, filters);
    const docs = await this.paymentTransactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filters?.skip || 0)
      .limit(filters?.limit || 50)
      .exec();
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async sumAmountByBusinessId(
    businessId: string,
    status?: PesapalTransactionStatus,
  ): Promise<number> {
    const matchStage: TransactionFilterQuery = { businessId };
    if (status !== undefined) {
      matchStage.statusCode = status;
    }

    const result = await this.paymentTransactionModel.aggregate<{
      _id: null;
      total: number;
    }>([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  private buildFilterQuery(
    baseQuery: TransactionFilterQuery,
    filters?: TransactionFilters,
  ): TransactionFilterQuery {
    const query: TransactionFilterQuery = { ...baseQuery };

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    if (filters?.status !== undefined) {
      query.statusCode = filters.status;
    }

    return query;
  }

  private toDomainEntity(doc: PaymentTransactionDocument): PaymentTransaction {
    return new PaymentTransaction(
      doc._id.toString(),
      doc.paymentLinkId,
      doc.userId,
      doc.businessId,
      doc.orderTrackingId,
      doc.merchantReference,
      doc.paymentMethod,
      doc.confirmationCode,
      doc.statusCode as PesapalTransactionStatus,
      doc.statusMessage,
      doc.amount,
      doc.currency,
      doc.paymentAccount,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
