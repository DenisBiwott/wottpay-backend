import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(id: string, user: Partial<User>): Promise<void>;
  create(user: User): Promise<User>;
}
