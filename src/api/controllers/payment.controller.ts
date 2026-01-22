// Payment controller
import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from 'src/application/use-cases/payments/payment.service';
import { CreatePaymentDto } from 'src/application/dtos/create-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }
}
