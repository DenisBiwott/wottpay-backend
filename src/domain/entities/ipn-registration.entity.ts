import { IpnNotificationType } from '../enums/ipn-notification-type.enum';

export class IpnRegistration {
  constructor(
    public id: string,
    public businessId: string,
    public ipnId: string,
    public url: string,
    public notificationType: IpnNotificationType,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
