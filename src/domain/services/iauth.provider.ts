// Interface for JWT/TOTP logic
export interface IAuthProvider {
  generateJWT(payload: object): string;
  verifyJWT(token: string): object | null;
  generateTOTP(secret: string): string;
  verifyTOTP(token: string, secret: string): boolean;
}
