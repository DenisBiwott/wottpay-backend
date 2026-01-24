import { IpnRegistration } from '../entities/ipn-registration.entity';

export interface IIpnRegistrationRepository {
  save(registration: IpnRegistration): Promise<IpnRegistration>;
  findById(id: string): Promise<IpnRegistration | null>;
  findByIpnId(ipnId: string): Promise<IpnRegistration | null>;
  findByBusinessId(businessId: string): Promise<IpnRegistration[]>;
  findByUrl(url: string): Promise<IpnRegistration | null>;
  delete(id: string): Promise<boolean>;
}
