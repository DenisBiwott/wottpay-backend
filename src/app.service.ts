import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Fear enlists the body; Purpose enlists the heart.';
  }
}
