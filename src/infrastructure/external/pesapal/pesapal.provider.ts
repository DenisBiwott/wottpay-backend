import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  IPesapalProvider,
  PesapalAuthResponse,
  PesapalRegisterIpnRequest,
  PesapalRegisterIpnResponse,
  PesapalIpnListItem,
  PesapalSubmitOrderRequest,
  PesapalSubmitOrderResponse,
  PesapalTransactionStatusResponse,
  PesapalCancelOrderResponse,
} from 'src/domain/services/ipesapal.provider';

@Injectable()
export class PesapalProvider implements IPesapalProvider {
  private readonly logger = new Logger(PesapalProvider.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('PESAPAL_BASE_URL') ||
      'https://cybqa.pesapal.com/pesapalv3/api';
  }

  async getAccessToken(
    consumerKey: string,
    consumerSecret: string,
  ): Promise<PesapalAuthResponse> {
    try {
      const response: AxiosResponse<PesapalAuthResponse> = await firstValueFrom(
        this.httpService.post<PesapalAuthResponse>(
          `${this.baseUrl}/Auth/RequestToken`,
          {
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        ),
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Pesapal auth error: ${err.message}`, err.stack);
      throw error;
    }
  }

  async registerIpn(
    token: string,
    request: PesapalRegisterIpnRequest,
  ): Promise<PesapalRegisterIpnResponse> {
    try {
      const response: AxiosResponse<PesapalRegisterIpnResponse> =
        await firstValueFrom(
          this.httpService.post<PesapalRegisterIpnResponse>(
            `${this.baseUrl}/URLSetup/RegisterIPN`,
            request,
            {
              headers: this.getAuthHeaders(token),
            },
          ),
        );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Pesapal register IPN error: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async getRegisteredIpns(token: string): Promise<PesapalIpnListItem[]> {
    try {
      const response: AxiosResponse<PesapalIpnListItem[]> =
        await firstValueFrom(
          this.httpService.get<PesapalIpnListItem[]>(
            `${this.baseUrl}/URLSetup/GetIpnList`,
            {
              headers: this.getAuthHeaders(token),
            },
          ),
        );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Pesapal get IPN list error: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async submitOrder(
    token: string,
    request: PesapalSubmitOrderRequest,
  ): Promise<PesapalSubmitOrderResponse> {
    try {
      const response: AxiosResponse<PesapalSubmitOrderResponse> =
        await firstValueFrom(
          this.httpService.post<PesapalSubmitOrderResponse>(
            `${this.baseUrl}/Transactions/SubmitOrderRequest`,
            request,
            {
              headers: this.getAuthHeaders(token),
            },
          ),
        );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Pesapal submit order error: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async getTransactionStatus(
    token: string,
    orderTrackingId: string,
  ): Promise<PesapalTransactionStatusResponse> {
    try {
      const response: AxiosResponse<PesapalTransactionStatusResponse> =
        await firstValueFrom(
          this.httpService.get<PesapalTransactionStatusResponse>(
            `${this.baseUrl}/Transactions/GetTransactionStatus`,
            {
              headers: this.getAuthHeaders(token),
              params: { orderTrackingId },
            },
          ),
        );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Pesapal get transaction status error: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async cancelOrder(
    token: string,
    orderTrackingId: string,
  ): Promise<PesapalCancelOrderResponse> {
    try {
      const response: AxiosResponse<PesapalCancelOrderResponse> =
        await firstValueFrom(
          this.httpService.post<PesapalCancelOrderResponse>(
            `${this.baseUrl}/Transactions/CancelOrder`,
            { order_tracking_id: orderTrackingId },
            {
              headers: this.getAuthHeaders(token),
            },
          ),
        );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Pesapal cancel order error: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  private getAuthHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }
}
