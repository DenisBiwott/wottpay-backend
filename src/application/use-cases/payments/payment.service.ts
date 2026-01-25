import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentLink } from 'src/domain/entities/payment-link.entity';
import { IpnRegistration } from 'src/domain/entities/ipn-registration.entity';
import { PaymentStatus } from 'src/domain/enums/payment-status.enum';
import { IpnNotificationType } from 'src/domain/enums/ipn-notification-type.enum';
import { PesapalTransactionStatus } from 'src/domain/enums/pesapal-transaction-status.enum';
import type { IBusinessRepository } from 'src/domain/repositories/business.repo';
import type { IPaymentLinkRepository } from 'src/domain/repositories/payment-link.repo';
import type { IIpnRegistrationRepository } from 'src/domain/repositories/ipn-registration.repo';
import type { IPaymentTransactionRepository } from 'src/domain/repositories/payment-transaction.repo';
import type {
  IPesapalProvider,
  PesapalBillingAddress,
} from 'src/domain/services/ipesapal.provider';
import { TokenCacheService } from './token-cache.service';
import {
  CreatePaymentOrderDto,
  RegisterIpnDto,
  GetTransactionStatusDto,
  CancelOrderDto,
  IpnCallbackDto,
  PaymentOrderResponseDto,
  TransactionStatusResponseDto,
  IpnRegistrationResponseDto,
  IpnCallbackResponseDto,
} from 'src/application/dtos/pesapal';
import { PaymentTransaction } from 'src/domain/entities/payment-transaction.entity';
import { EncryptionService } from 'src/infrastructure/security/encryption.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject('IPaymentLinkRepository')
    private readonly paymentLinkRepo: IPaymentLinkRepository,
    @Inject('IBusinessRepository')
    private readonly businessRepo: IBusinessRepository,
    @Inject('IIpnRegistrationRepository')
    private readonly ipnRegistrationRepo: IIpnRegistrationRepository,
    @Inject('IPaymentTransactionRepository')
    private readonly paymentTransactionRepo: IPaymentTransactionRepository,
    @Inject('IPesapalProvider')
    private readonly pesapalProvider: IPesapalProvider,
    private readonly tokenCacheService: TokenCacheService,
    private readonly encryptionService: EncryptionService,
  ) {}

  private async getAccessToken(businessId: string): Promise<string> {
    const cachedToken = this.tokenCacheService.getToken(businessId);
    if (cachedToken) {
      return cachedToken;
    }

    const business = await this.businessRepo.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const decryptedKey = this.encryptionService.decrypt(
      business.pesapalConsumerKey,
    );
    const decryptedSecret = this.encryptionService.decrypt(
      business.pesapalConsumerSecret,
    );

    const authResponse = await this.pesapalProvider.getAccessToken(
      decryptedKey,
      decryptedSecret,
    );

    if (authResponse.error) {
      throw new BadRequestException(
        `Pesapal auth failed: ${authResponse.error.message}`,
      );
    }

    this.tokenCacheService.setToken(
      businessId,
      authResponse.token,
      authResponse.expiryDate,
    );

    return authResponse.token;
  }

  async createPaymentOrder(
    dto: CreatePaymentOrderDto,
  ): Promise<PaymentOrderResponseDto> {
    const business = await this.businessRepo.findById(dto.businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const token = await this.getAccessToken(dto.businessId);

    const merchantRef =
      dto.merchantRef ?? uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();

    const billingAddress: PesapalBillingAddress = dto.billingAddress
      ? {
          email_address: dto.billingAddress.emailAddress,
          phone_number: dto.billingAddress.phoneNumber,
          country_code: dto.billingAddress.countryCode,
          first_name: dto.billingAddress.firstName,
          middle_name: dto.billingAddress.middleName,
          last_name: dto.billingAddress.lastName,
          line_1: dto.billingAddress.line1,
          line_2: dto.billingAddress.line2,
          city: dto.billingAddress.city,
          state: dto.billingAddress.state,
          postal_code: dto.billingAddress.postalCode,
          zip_code: dto.billingAddress.zipCode,
        }
      : {};

    const orderRequest = {
      id: merchantRef,
      currency: dto.currency,
      amount: dto.amount,
      description: dto.description,
      callback_url: dto.callbackUrl,
      notification_id: dto.notificationId,
      billing_address: billingAddress,
      cancellation_url: dto.cancellationUrl,
      account_number: dto.accountNumber,
      subscription_details: dto.subscriptionDetails
        ? {
            start_date: dto.subscriptionDetails.startDate,
            end_date: dto.subscriptionDetails.endDate,
            frequency: dto.subscriptionDetails.frequency,
          }
        : undefined,
    };

    const pesapalResponse = await this.pesapalProvider.submitOrder(
      token,
      orderRequest,
    );

    if (pesapalResponse.error) {
      throw new BadRequestException(
        `Pesapal order submission failed: ${pesapalResponse.error.message}`,
      );
    }

    const paymentLink = new PaymentLink(
      undefined as any,
      merchantRef,
      pesapalResponse.order_tracking_id,
      dto.businessId,
      dto.amount,
      dto.currency,
      PaymentStatus.ACTIVE,
      new Date(),
      new Date(),
      pesapalResponse.redirect_url,
      dto.description,
      dto.callbackUrl,
      dto.notificationId,
      dto.billingAddress?.emailAddress,
      dto.billingAddress?.phoneNumber,
      dto.billingAddress?.firstName,
      dto.billingAddress?.lastName,
      dto.accountNumber,
    );

    const savedPaymentLink = await this.paymentLinkRepo.save(paymentLink);
    return PaymentOrderResponseDto.fromEntity(savedPaymentLink);
  }

  async getTransactionStatus(
    dto: GetTransactionStatusDto,
  ): Promise<TransactionStatusResponseDto> {
    const token = await this.getAccessToken(dto.businessId);

    const statusResponse = await this.pesapalProvider.getTransactionStatus(
      token,
      dto.orderTrackingId,
    );

    if (statusResponse.status !== '200') {
      throw new BadRequestException(
        `Failed to get transaction status: ${statusResponse?.error?.message || 'Unknown error'}`,
      );
    }

    const paymentLink = await this.paymentLinkRepo.findByTrackingId(
      dto.orderTrackingId,
    );
    if (paymentLink) {
      const newStatus = this.mapPesapalStatusToPaymentStatus(
        statusResponse.status_code as PesapalTransactionStatus,
      );
      await this.paymentLinkRepo.updateStatus(dto.orderTrackingId, newStatus);
    }

    return TransactionStatusResponseDto.fromPesapalResponse(statusResponse);
  }

  async cancelOrder(
    dto: CancelOrderDto,
  ): Promise<{ orderTrackingId: string; status: string; message: string }> {
    const token = await this.getAccessToken(dto.businessId);

    const cancelResponse = await this.pesapalProvider.cancelOrder(
      token,
      dto.orderTrackingId,
    );

    if (cancelResponse.error) {
      throw new BadRequestException(
        `Failed to cancel order: ${cancelResponse.error.message}`,
      );
    }

    const paymentLink = await this.paymentLinkRepo.findByTrackingId(
      dto.orderTrackingId,
    );
    if (paymentLink) {
      await this.paymentLinkRepo.updateStatus(
        dto.orderTrackingId,
        PaymentStatus.RECALLED,
      );
    }

    return {
      orderTrackingId: cancelResponse.order_tracking_id,
      status: cancelResponse.status,
      message: cancelResponse.message,
    };
  }

  async registerIpn(dto: RegisterIpnDto): Promise<IpnRegistrationResponseDto> {
    const business = await this.businessRepo.findById(dto.businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const token = await this.getAccessToken(dto.businessId);

    const registerResponse = await this.pesapalProvider.registerIpn(token, {
      url: dto.url,
      ipn_notification_type: dto.notificationType,
    });

    if (registerResponse.error) {
      throw new BadRequestException(
        `Failed to register IPN: ${registerResponse.error.message}`,
      );
    }

    const ipnRegistration = new IpnRegistration(
      undefined as any,
      dto.businessId,
      registerResponse.ipn_id,
      registerResponse.url,
      dto.notificationType as IpnNotificationType,
      new Date(registerResponse.created_date),
      new Date(),
    );

    const savedRegistration =
      await this.ipnRegistrationRepo.save(ipnRegistration);
    return IpnRegistrationResponseDto.fromEntity(savedRegistration);
  }

  async getRegisteredIpns(
    businessId: string,
  ): Promise<IpnRegistrationResponseDto[]> {
    const business = await this.businessRepo.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const registrations =
      await this.ipnRegistrationRepo.findByBusinessId(businessId);
    return registrations.map((reg) =>
      IpnRegistrationResponseDto.fromEntity(reg),
    );
  }

  async handleIpnCallback(
    dto: IpnCallbackDto,
  ): Promise<IpnCallbackResponseDto> {
    try {
      this.logger.log(
        `IPN callback received: TrackingId=${dto.OrderTrackingId}, MerchantRef=${dto.OrderMerchantReference}`,
      );

      const paymentLink = await this.paymentLinkRepo.findByTrackingId(
        dto.OrderTrackingId,
      );

      if (!paymentLink) {
        this.logger.warn(
          `Payment link not found for tracking ID: ${dto.OrderTrackingId}`,
        );
        return IpnCallbackResponseDto.success(
          dto.OrderTrackingId,
          dto.OrderMerchantReference,
          dto.OrderNotificationType,
        );
      }

      const token = await this.getAccessToken(paymentLink.businessId);
      const statusResponse = await this.pesapalProvider.getTransactionStatus(
        token,
        dto.OrderTrackingId,
      );

      // Successful response
      if (statusResponse.status == '200') {
        const newStatus = this.mapPesapalStatusToPaymentStatus(
          statusResponse.status_code as PesapalTransactionStatus,
        );
        await this.paymentLinkRepo.updateStatus(dto.OrderTrackingId, newStatus);

        const transaction = new PaymentTransaction(
          undefined as any,
          paymentLink.id,
          dto.OrderTrackingId,
          dto.OrderMerchantReference,
          statusResponse.payment_method,
          statusResponse.confirmation_code,
          statusResponse.status_code as PesapalTransactionStatus,
          statusResponse.payment_status_description,
          statusResponse.amount,
          statusResponse.currency,
          statusResponse.payment_account,
          new Date(),
          new Date(),
        );
        await this.paymentTransactionRepo.save(transaction);

        this.logger.log(
          `Payment status updated: ${dto.OrderTrackingId} -> ${newStatus}`,
        );
      }

      return IpnCallbackResponseDto.success(
        dto.OrderTrackingId,
        dto.OrderMerchantReference,
        dto.OrderNotificationType,
      );
    } catch (error: unknown) {
      // Always return success to PesaPal even on internal errors.
      // PesaPal will retry IPN callbacks if it doesn't receive a success response,
      // which could cause duplicate processing attempts. By returning success,
      // we acknowledge receipt and handle errors internally through logging.
      const err = error as Error;
      this.logger.error(`IPN callback error: ${err.message}`, err.stack);
      return IpnCallbackResponseDto.success(
        dto.OrderTrackingId,
        dto.OrderMerchantReference,
        dto.OrderNotificationType,
      );
    }
  }

  async getPaymentsByBusiness(
    businessId: string,
  ): Promise<PaymentOrderResponseDto[]> {
    const business = await this.businessRepo.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const payments = await this.paymentLinkRepo.findAllByBusiness(businessId);
    return payments.map((payment) =>
      PaymentOrderResponseDto.fromEntity(payment),
    );
  }

  async getPaymentByTrackingId(
    trackingId: string,
  ): Promise<PaymentOrderResponseDto> {
    const payment = await this.paymentLinkRepo.findByTrackingId(trackingId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return PaymentOrderResponseDto.fromEntity(payment);
  }

  /**
   * Maps PesaPal transaction status codes to internal PaymentStatus.
   *
   * Status mapping rationale:
   * - COMPLETED -> COMPLETED: Direct mapping for successful payments
   * - FAILED -> FAILED: Direct mapping for failed payments
   * - REVERSED -> RECALLED: PesaPal reversals are treated as recalled/cancelled
   * - PENDING/unknown -> ACTIVE: Pending transactions remain active for tracking
   *
   * Using ACTIVE as default ensures new/unknown statuses don't break the system.
   */
  private mapPesapalStatusToPaymentStatus(
    statusCode: PesapalTransactionStatus,
  ): PaymentStatus {
    switch (statusCode) {
      case PesapalTransactionStatus.COMPLETED:
        return PaymentStatus.COMPLETED;
      case PesapalTransactionStatus.FAILED:
        return PaymentStatus.FAILED;
      case PesapalTransactionStatus.REVERSED:
        return PaymentStatus.RECALLED;
      case PesapalTransactionStatus.PENDING:
      default:
        return PaymentStatus.ACTIVE;
    }
  }
}
