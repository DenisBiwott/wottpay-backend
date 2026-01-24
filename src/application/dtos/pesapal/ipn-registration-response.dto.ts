import { IpnRegistration } from 'src/domain/entities/ipn-registration.entity';

export class IpnRegistrationResponseDto {
  id: string;
  businessId: string;
  ipnId: string;
  url: string;
  notificationType: string;
  createdAt: Date;

  static fromEntity(entity: IpnRegistration): IpnRegistrationResponseDto {
    const dto = new IpnRegistrationResponseDto();
    dto.id = entity.id;
    dto.businessId = entity.businessId;
    dto.ipnId = entity.ipnId;
    dto.url = entity.url;
    dto.notificationType = entity.notificationType;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
