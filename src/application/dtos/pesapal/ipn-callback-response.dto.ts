export class IpnCallbackResponseDto {
  orderNotificationType: string;
  orderTrackingId: string;
  orderMerchantReference: string;
  status: number;

  static success(
    orderTrackingId: string,
    orderMerchantReference: string,
    orderNotificationType: string = 'IPNCHANGE',
  ): IpnCallbackResponseDto {
    const dto = new IpnCallbackResponseDto();
    dto.orderNotificationType = orderNotificationType;
    dto.orderTrackingId = orderTrackingId;
    dto.orderMerchantReference = orderMerchantReference;
    dto.status = 200;
    return dto;
  }
}
