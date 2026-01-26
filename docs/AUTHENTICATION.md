# WottPay Authentication & Authorization Guide

This document describes the authentication and authorization system implemented in WottPay, including JWT-based authentication, two-factor authentication (TOTP), Role-Based Access Control (RBAC), and route protection mechanisms.

## Overview

WottPay implements a secure authentication system with the following components:

| Technology            | Purpose                               |
| --------------------- | ------------------------------------- |
| Passport.js           | Authentication middleware framework   |
| JWT (JSON Web Tokens) | Stateless session management          |
| Refresh Tokens        | Long-lived tokens for session renewal |
| RBAC                  | Role-Based Access Control             |
| bcrypt                | Password hashing                      |
| otplib (TOTP)         | Time-based one-time passwords for 2FA |

### Security Principles

- **Stateless Authentication**: JWTs eliminate server-side session storage
- **Token Rotation**: Refresh tokens are rotated on each use
- **Defense in Depth**: Optional TOTP adds a second authentication factor
- **Secure Password Storage**: bcrypt with salt for password hashing
- **Token Expiration**: Short-lived access tokens, long-lived refresh tokens

## Authentication Flow Diagrams

### Standard Login Flow (Without TOTP)

```
┌─────────┐          ┌────────────────┐          ┌──────────────┐
│  Client │          │ AuthController │          │  AuthService │
└────┬────┘          └───────┬────────┘          └──────┬───────┘
     │                       │                          │
     │  POST /auth/login     │                          │
     │  {email, password}    │                          │
     │──────────────────────►│                          │
     │                       │                          │
     │                       │  login(dto)              │
     │                       │─────────────────────────►│
     │                       │                          │
     │                       │                          │ Validate password
     │                       │                          │ Generate JWT
     │                       │                          │ (totpVerified: true)
     │                       │                          │
     │                       │  AuthResponseDto         │
     │                       │◄─────────────────────────│
     │                       │                          │
     │  {accessToken,        │                          │
     │   requiresTotp: false,│                          │
     │   user: {...}}        │                          │
     │◄──────────────────────│                          │
     │                       │                          │
     │  Use token for        │                          │
     │  protected routes     │                          │
     │                       │                          │
```

### Login Flow with TOTP Enabled

```
┌─────────┐          ┌────────────────┐          ┌──────────────┐
│  Client │          │ AuthController │          │  AuthService │
└────┬────┘          └───────┬────────┘          └──────┬───────┘
     │                       │                          │
     │  POST /auth/login     │                          │
     │  {email, password}    │                          │
     │──────────────────────►│                          │
     │                       │                          │
     │                       │  login(dto)              │
     │                       │─────────────────────────►│
     │                       │                          │
     │                       │                          │ Validate password
     │                       │                          │ Generate JWT
     │                       │                          │ (totpVerified: false)
     │                       │                          │
     │  {accessToken,        │                          │
     │   requiresTotp: true, │                          │
     │   user: {...}}        │                          │
     │◄──────────────────────│                          │
     │                       │                          │
     │  POST /auth/totp/verify                          │
     │  {code: "123456"}     │                          │
     │  Authorization: Bearer│                          │
     │──────────────────────►│                          │
     │                       │                          │
     │                       │  verifyTotp(userId, dto) │
     │                       │─────────────────────────►│
     │                       │                          │
     │                       │                          │ Validate TOTP code
     │                       │                          │ Generate new JWT
     │                       │                          │ (totpVerified: true)
     │                       │                          │
     │  {accessToken,        │                          │
     │   message: "..."}     │                          │
     │◄──────────────────────│                          │
     │                       │                          │
     │  Use new token for    │                          │
     │  all protected routes │                          │
     │                       │                          │
```

### Route Protection Sequence

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌────────────┐
│  Client │    │JwtAuthGuard │    │ JwtStrategy │    │TotpVerifiedGuard│    │ Controller │
└────┬────┘    └──────┬──────┘    └──────┬──────┘    └────────┬────────┘    └─────┬──────┘
     │                │                  │                    │                   │
     │  Request +     │                  │                    │                   │
     │  Bearer Token  │                  │                    │                   │
     │───────────────►│                  │                    │                   │
     │                │                  │                    │                   │
     │                │ Check @Public()  │                    │                   │
     │                │ decorator        │                    │                   │
     │                │                  │                    │                   │
     │                │ Validate JWT     │                    │                   │
     │                │─────────────────►│                    │                   │
     │                │                  │                    │                   │
     │                │                  │ Verify signature   │                   │
     │                │                  │ Extract payload    │                   │
     │                │                  │                    │                   │
     │                │ user = payload   │                    │                   │
     │                │◄─────────────────│                    │                   │
     │                │                  │                    │                   │
     │                │                  │                    │                   │
     │                │ Check @RequireTotp()                  │                   │
     │                │──────────────────────────────────────►│                   │
     │                │                  │                    │                   │
     │                │                  │                    │ Check totpVerified │
     │                │                  │                    │ in user payload   │
     │                │                  │                    │                   │
     │                │                  │                    │ Allow/Deny        │
     │                │                  │                    │──────────────────►│
     │                │                  │                    │                   │
     │                │                  │                    │                   │ Handle
     │                │                  │                    │                   │ Request
     │◄───────────────────────────────────────────────────────────────────────────│
     │                │                  │                    │                   │
```

## JWT Authentication

### Token Structure

The JWT payload contains:

```typescript
interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role (e.g., 'merchant', 'admin')
  totpVerified?: boolean; // Whether TOTP has been verified (for 2FA users)
}
```

### Token Generation

Tokens are generated by `AuthProvider` using NestJS `JwtService`:

```typescript
// src/infrastructure/security/auth.provider.ts
generateJWT(payload: object): string {
  return this.jwtService.sign(payload);
}
```

### Token Validation

The `JwtStrategy` validates incoming tokens:

```typescript
// src/infrastructure/security/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(req: any, payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      totpVerified: payload.totpVerified,
    };
  }
}
```

### Configuration

JWT is configured via environment variables in `AuthModule`:

| Variable         | Description                     | Default            |
| ---------------- | ------------------------------- | ------------------ |
| `JWT_SECRET`     | Secret key for signing tokens   | `'default-secret'` |
| `JWT_EXPIRES_IN` | Token expiration time (seconds) | `3600` (1 hour)    |

## Two-Factor Authentication (TOTP)

WottPay implements RFC 6238 compliant Time-based One-Time Passwords (TOTP).

### Libraries Used

```typescript
// src/infrastructure/security/auth.provider.ts
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
```

- **@otplib/totp**: TOTP implementation
- **@noble/hashes**: Modern, audited HMAC-SHA1 cryptographic implementation
- **@scure/base**: RFC 4648 compliant base32 encoding

### TOTP Setup Flow (Two-Step Process)

**Step 1: Initiate Setup**

```
POST /auth/totp/setup
Authorization: Bearer <token>

Response:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauthUrl": "otpauth://totp/WottPay:user@example.com?secret=..."
}
```

The `otpauthUrl` can be converted to a QR code for authenticator apps.

**Step 2: Confirm Setup**

```
POST /auth/totp/confirm
Authorization: Bearer <token>
{
  "code": "123456"
}

Response:
{
  "message": "TOTP enabled successfully"
}
```

### Verification During Login

After password verification, if TOTP is enabled, the initial JWT has `totpVerified: false`. The user must call:

```
POST /auth/totp/verify
Authorization: Bearer <token>
{
  "code": "123456"
}

Response:
{
  "accessToken": "<new-token-with-totpVerified-true>",
  "message": "TOTP verified successfully"
}
```

### Disabling TOTP

```
POST /auth/totp/disable
Authorization: Bearer <token>
{
  "code": "123456"
}

Response:
{
  "message": "TOTP disabled successfully"
}
```

Requires a valid TOTP code to prevent unauthorized disabling.

### Security Properties

| Property        | Value                               |
| --------------- | ----------------------------------- |
| Algorithm       | HMAC-SHA1 (per RFC 6238)            |
| Time Step       | 30 seconds (standard)               |
| Code Length     | 6 digits                            |
| Epoch Tolerance | 30 seconds (allows for clock drift) |

## Password Security

### Hashing

Passwords are hashed using bcrypt:

```typescript
// src/application/use-cases/auth/auth.service.ts
const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
```

### Validation Rules

Defined in `LoginDto`:

```typescript
// src/application/dtos/auth/login.dto.ts
@IsEmail()
email: string;

@IsString()
@MinLength(8)
password: string;
```

| Rule            | Requirement          |
| --------------- | -------------------- |
| Email           | Valid email format   |
| Password Length | Minimum 8 characters |

## Guards and Decorators

### JwtAuthGuard

Protects routes requiring authentication. Supports the `@Public()` decorator to bypass authentication.

```typescript
// src/infrastructure/security/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

### TotpVerifiedGuard

Ensures TOTP verification for sensitive operations. Activated by `@RequireTotp()` decorator.

```typescript
// src/infrastructure/security/totp-verified.guard.ts
@Injectable()
export class TotpVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requireTotp = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TOTP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireTotp) return true;

    const user = request.user;
    if (user.totpVerified === false) {
      throw new ForbiddenException('TOTP verification required');
    }

    return true;
  }
}
```

### RolesGuard

Restricts access based on user roles. Works with the `@Roles()` decorator.

```typescript
// src/infrastructure/security/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = request.user;
    const hasRole = requiredRoles.includes(user.role as UserRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Required roles are ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

### Decorators

```typescript
// src/infrastructure/security/decorators.ts
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const RequireTotp = () => SetMetadata(REQUIRE_TOTP_KEY, true);
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### Usage Examples

**Public route (no authentication):**

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

**Protected route (JWT required):**

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req: any) {
  return this.authService.getProfile(req.user.id);
}
```

**Protected route requiring TOTP verification:**

```typescript
@UseGuards(JwtAuthGuard, TotpVerifiedGuard)
@RequireTotp()
@Post('sensitive-operation')
async sensitiveOperation(@Request() req: any) {
  // Only accessible after TOTP verification
}
```

**Protected route with role restriction:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MERCHANT)
@Post('payments/orders')
async createPaymentOrder(@Body() dto: CreatePaymentOrderDto, @Request() req) {
  // Only ADMIN and MERCHANT roles can access
  return this.paymentService.createPaymentOrder(dto, req.user.id);
}
```

**Admin-only route:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('event-logs')
async getEventLogs(@Request() req) {
  // Only ADMIN can access event logs
  return this.eventLogService.getEventsByBusiness(req.user.businessId);
}
```

## Role-Based Access Control (RBAC)

WottPay implements a role-based access control system with three user roles.

### User Roles

```typescript
// src/domain/enums/user-role.enum.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  MERCHANT = 'MERCHANT',
  READ_ONLY = 'READ_ONLY',
}
```

| Role      | Description                                              |
| --------- | -------------------------------------------------------- |
| ADMIN     | Full access to all features, user management, event logs |
| MERCHANT  | Can create payments, view own transactions and links     |
| READ_ONLY | View-only access to transactions, links, and insights    |

### Permission Matrix

| Action                 | ADMIN | MERCHANT | READ_ONLY |
| ---------------------- | ----- | -------- | --------- |
| Create Payment         | Yes   | Yes      | No        |
| View All Transactions  | Yes   | No       | No        |
| View Own Transactions  | Yes   | Yes      | Yes       |
| View All Payment Links | Yes   | No       | No        |
| View Own Payment Links | Yes   | Yes      | Yes       |
| View Insights          | Yes   | Yes      | Yes       |
| View Event Logs        | Yes   | No       | No        |
| Manage Users           | Yes   | No       | No        |
| Manage Business        | Yes   | No       | No        |
| Register IPN           | Yes   | No       | No        |
| Cancel Payment         | Yes   | Yes      | No        |

### Data Scoping

RBAC also controls data visibility:

- **ADMIN**: Can see all transactions and payment links for their business
- **MERCHANT/READ_ONLY**: Can only see their own transactions and payment links

```typescript
// Example: Transactions endpoint with role-based scoping
async getTransactions(userId, businessId, role, filters) {
  if (role === UserRole.ADMIN) {
    return findByBusinessId(businessId, filters); // All business transactions
  }
  return findByUserIdAndBusinessId(userId, businessId, filters); // Own transactions only
}
```

### JWT Payload with Roles

The JWT payload includes role and businessId:

```typescript
interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // UserRole (ADMIN, MERCHANT, READ_ONLY)
  businessId: string; // Associated business ID
  totpVerified?: boolean;
}
```

## API Endpoints Reference

| Method | Endpoint             | Guards       | Description                                |
| ------ | -------------------- | ------------ | ------------------------------------------ |
| POST   | `/auth/login`        | @Public()    | Authenticate with email and password       |
| POST   | `/auth/totp/verify`  | JwtAuthGuard | Verify TOTP code and get full-access token |
| POST   | `/auth/totp/setup`   | JwtAuthGuard | Initiate TOTP setup (returns secret + URI) |
| POST   | `/auth/totp/confirm` | JwtAuthGuard | Confirm TOTP setup with verification code  |
| POST   | `/auth/totp/disable` | JwtAuthGuard | Disable TOTP (requires valid code)         |
| GET    | `/auth/profile`      | JwtAuthGuard | Get current user profile                   |

## Request/Response DTOs

### LoginDto

```typescript
// src/application/dtos/auth/login.dto.ts
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### AuthResponseDto

```typescript
// src/application/dtos/auth/auth-response.dto.ts
class AuthResponseDto {
  accessToken: string;
  requiresTotp: boolean;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}
```

### TotpSetupResponseDto

```typescript
// src/application/dtos/auth/auth-response.dto.ts
class TotpSetupResponseDto {
  secret: string; // Base32-encoded secret for manual entry
  otpauthUrl: string; // URI for QR code generation
}
```

### VerifyTotpDto / SetupTotpDto

```typescript
// src/application/dtos/auth/verify-totp.dto.ts
class VerifyTotpDto {
  @IsString()
  @Length(6, 6)
  code: string;
}
```

### TotpVerifyResponseDto

```typescript
// src/application/dtos/auth/auth-response.dto.ts
class TotpVerifyResponseDto {
  accessToken: string; // New token with totpVerified: true
  message: string;
}
```

## Environment Configuration

| Variable         | Required | Description                                          |
| ---------------- | -------- | ---------------------------------------------------- |
| `JWT_SECRET`     | Yes      | Secret key for JWT signing (use strong random value) |
| `JWT_EXPIRES_IN` | No       | Token expiration in seconds (default: 3600)          |

**Example `.env`:**

```env
JWT_SECRET=your-very-long-and-random-secret-key-here
JWT_EXPIRES_IN=3600
```

## Security Considerations

### Attack Mitigations

| Attack                   | Mitigation                                  |
| ------------------------ | ------------------------------------------- |
| Password Brute Force     | bcrypt with high cost factor, rate limiting |
| Token Theft              | Short expiration, HTTPS only                |
| Session Hijacking        | Stateless JWT, no server-side sessions      |
| TOTP Replay              | Time-based with epoch tolerance             |
| Unauthorized 2FA Disable | Requires valid TOTP code to disable         |

### Best Practices Implemented

- **Constant-Time Comparison**: bcrypt and TOTP verification use timing-safe comparison
- **Secure Secret Storage**: TOTP secrets stored in database (consider encryption at rest)
- **No Password in Response**: User password hash never returned to client
- **Minimal Payload**: JWT contains only necessary claims
- **Separation of Concerns**: Authentication logic abstracted via `IAuthProvider` interface

## Key Files Reference

| File                                                 | Purpose                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| `src/infrastructure/security/jwt.strategy.ts`        | JWT validation strategy                            |
| `src/infrastructure/security/jwt-auth.guard.ts`      | Authentication guard                               |
| `src/infrastructure/security/totp-verified.guard.ts` | 2FA verification guard                             |
| `src/infrastructure/security/roles.guard.ts`         | Role-based access control guard                    |
| `src/infrastructure/security/auth.provider.ts`       | JWT and TOTP generation/verification               |
| `src/infrastructure/security/decorators.ts`          | @Public(), @RequireTotp(), and @Roles() decorators |
| `src/application/use-cases/auth/auth.service.ts`     | Authentication business logic                      |
| `src/api/controllers/auth.controller.ts`             | Auth API endpoints                                 |
| `src/infrastructure/modules/auth.module.ts`          | Module configuration                               |
| `src/domain/entities/user.entity.ts`                 | User entity with auth fields                       |
| `src/domain/enums/user-role.enum.ts`                 | User role enumeration                              |
| `src/domain/services/iauth.provider.ts`              | Auth provider interface                            |
| `src/application/dtos/auth/*.ts`                     | Auth request/response DTOs                         |
