import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: { skip?: number; limit?: number }): Promise<User[]>;
  save(user: User): Promise<void>;
  update(id: string, user: Partial<User>): Promise<void>;
  create(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
