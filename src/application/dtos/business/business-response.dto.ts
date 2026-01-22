import { Business } from 'src/domain/entities/business.entity';

export class BusinessResponseDto {
  id: string;
  name: string;
  pesapalConsumerKey: string;
  pesapalConsumerSecret: string;

  static fromEntity(business: Business): BusinessResponseDto {
    const dto = new BusinessResponseDto();
    dto.id = business.id;
    dto.name = business.name;
    dto.pesapalConsumerKey = business.pesapalConsumerKey;
    dto.pesapalConsumerSecret = business.pesapalConsumerSecret;
    return dto;
  }
}
