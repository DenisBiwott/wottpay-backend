import { Injectable } from '@nestjs/common';

interface CachedToken {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class TokenCacheService {
  private readonly tokenCache = new Map<string, CachedToken>();
  private readonly EXPIRY_BUFFER_SECONDS = 240; // 4 minutes; before actual expiry (Expires in 5 mins)

  getToken(businessId: string): string | null {
    const cached = this.tokenCache.get(businessId);
    if (!cached) {
      return null;
    }

    const now = new Date();
    const bufferTime = new Date(
      cached.expiresAt.getTime() - this.EXPIRY_BUFFER_SECONDS * 1000,
    );

    if (now >= bufferTime) {
      this.tokenCache.delete(businessId);
      return null;
    }

    return cached.token;
  }

  setToken(businessId: string, token: string, expiryDate: string): void {
    const expiresAt = new Date(expiryDate);
    this.tokenCache.set(businessId, { token, expiresAt });
  }

  clearToken(businessId: string): void {
    this.tokenCache.delete(businessId);
  }

  clearAllTokens(): void {
    this.tokenCache.clear();
  }
}
