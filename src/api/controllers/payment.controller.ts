import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from 'src/application/use-cases/payments/payment.service';
import {
  CreatePaymentOrderDto,
  RegisterIpnDto,
  GetTransactionStatusDto,
  CancelOrderDto,
  IpnCallbackDto,
} from 'src/application/dtos/pesapal';
import { JwtAuthGuard } from 'src/infrastructure/security/jwt-auth.guard';
import { Public } from 'src/infrastructure/security/decorators';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders')
  async createPaymentOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.paymentService.createPaymentOrder(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:trackingId')
  async getPaymentByTrackingId(@Param('trackingId') trackingId: string) {
    return this.paymentService.getPaymentByTrackingId(trackingId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/business/:businessId')
  async getPaymentsByBusiness(@Param('businessId') businessId: string) {
    return this.paymentService.getPaymentsByBusiness(businessId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getTransactionStatus(
    @Query('businessId') businessId: string,
    @Query('orderTrackingId') orderTrackingId: string,
  ) {
    const dto: GetTransactionStatusDto = { businessId, orderTrackingId };
    return this.paymentService.getTransactionStatus(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  async cancelOrder(@Body() dto: CancelOrderDto) {
    return this.paymentService.cancelOrder(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ipn/register')
  async registerIpn(@Body() dto: RegisterIpnDto) {
    return this.paymentService.registerIpn(dto);
  }

  @UseGuards(JwtAuthGuard)
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
