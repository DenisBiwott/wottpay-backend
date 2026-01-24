import { Business } from 'src/domain/entities/business.entity';

export class BusinessResponseDto {
  id: string;
  name: string;
  hasCredentials: boolean;

  static fromEntity(business: Business): BusinessResponseDto {
    const dto = new BusinessResponseDto();
    dto.id = business.id;
    dto.name = business.name;
    dto.hasCredentials =
      !!business.pesapalConsumerKey && !!business.pesapalConsumerSecret;
    return dto;
  }
}
