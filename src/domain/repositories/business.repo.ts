import { Business } from '../entities/business.entity';

export interface IBusinessRepository {
  findById(id: string): Promise<Business | null>;
  findByName(name: string): Promise<Business | null>;
  findAll(options?: { skip?: number; limit?: number }): Promise<Business[]>;
  save(business: Business): Promise<void>;
  update(id: string, business: Partial<Business>): Promise<void>;
  create(business: Business): Promise<Business>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
