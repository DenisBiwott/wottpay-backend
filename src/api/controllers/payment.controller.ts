import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from 'src/application/use-cases/payments/payment.service';
import {
  CreatePaymentOrderDto,
  RegisterIpnDto,
  GetTransactionStatusDto,
  CancelOrderDto,
  IpnCallbackDto,
} from 'src/application/dtos/pesapal';
import { TransactionFilterDto } from 'src/application/dtos/filters/transaction-filter.dto';
import { PaymentLinkFilterDto } from 'src/application/dtos/filters/payment-link-filter.dto';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from 'src/infrastructure/security/roles.guard';
import { Public, Roles } from 'src/infrastructure/security/decorators';
import { UserRole } from 'src/domain/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/infrastructure/security/jwt.strategy';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @Post('orders')
  async createPaymentOrder(
    @Body() dto: CreatePaymentOrderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.paymentService.createPaymentOrder(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get('orders/:trackingId')
  async getPaymentByTrackingId(@Param('trackingId') trackingId: string) {
    return this.paymentService.getPaymentByTrackingId(trackingId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get('orders/business/:businessId')
  async getPaymentsByBusiness(@Param('businessId') businessId: string) {
    return this.paymentService.getPaymentsByBusiness(businessId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get('transactions')
  async getTransactions(
    @Request() req: AuthenticatedRequest,
    @Query() filters: TransactionFilterDto,
  ) {
    const { startDate, endDate, status, page = 1, limit = 50 } = filters;
    return this.paymentService.getTransactions(
      req.user.id,
      req.user.businessId,
      req.user.role as UserRole,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        skip: (page - 1) * limit,
        limit,
      },
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get('links')
  async getPaymentLinks(
    @Request() req: AuthenticatedRequest,
    @Query() filters: PaymentLinkFilterDto,
  ) {
    const { startDate, endDate, status, page = 1, limit = 50 } = filters;
    return this.paymentService.getPaymentLinks(
      req.user.id,
      req.user.businessId,
      req.user.role as UserRole,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        skip: (page - 1) * limit,
        limit,
      },
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get('links/:id/with-transaction')
  async getPaymentLinkWithTransaction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.paymentService.getPaymentLinkWithTransaction(
      id,
      req.user.id,
      req.user.businessId,
      req.user.role as UserRole,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get('status')
  async getTransactionStatus(
    @Query('businessId') businessId: string,
    @Query('orderTrackingId') orderTrackingId: string,
  ) {
    const dto: GetTransactionStatusDto = { businessId, orderTrackingId };
    return this.paymentService.getTransactionStatus(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @Post('cancel')
  async cancelOrder(@Body() dto: CancelOrderDto) {
    return this.paymentService.cancelOrder(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('ipn/register')
  async registerIpn(@Body() dto: RegisterIpnDto) {
    return this.paymentService.registerIpn(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.READ_ONLY)
  @Get('ipn/list/:businessId')
  async getRegisteredIpns(@Param('businessId') businessId: string) {
    return this.paymentService.getRegisteredIpns(businessId);
  }

  @Public()
  @Post('ipn/callback')
  async handleIpnCallbackPost(@Body() dto: IpnCallbackDto) {
    return this.paymentService.handleIpnCallback(dto);
  }

  @Public()
  @Get('ipn/callback')
  async handleIpnCallbackGet(
    @Query('OrderTrackingId') OrderTrackingId: string,
    @Query('OrderMerchantReference') OrderMerchantReference: string,
    @Query('OrderNotificationType') OrderNotificationType?: string,
  ) {
    const dto: IpnCallbackDto = {
      OrderTrackingId,
      OrderMerchantReference,
      OrderNotificationType,
    };
    return this.paymentService.handleIpnCallback(dto);
  }
}
