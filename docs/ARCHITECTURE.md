# WottPay Architecture Guide

This document describes the architectural patterns and design decisions used in the WottPay backend.

## Clean Architecture Overview

WottPay follows Clean Architecture (also known as Hexagonal/Ports and Adapters) to achieve:

- **Independence from frameworks**: Business logic doesn't depend on NestJS specifics
- **Testability**: Core logic can be tested without external dependencies
- **Independence from UI**: The API layer can change without affecting business logic
- **Independence from database**: MongoDB can be swapped without changing business rules
- **Independence from external services**: PesaPal integration is abstracted behind interfaces

## Layer Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Layer                                      │
│                         src/api/controllers/                                │
│                                                                             │
│   Handles HTTP requests, authentication, request validation                 │
│   Depends on: Application Layer                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Application Layer                                   │
│                    src/application/use-cases/                               │
│                        src/application/dtos/                                │
│                                                                             │
│   Orchestrates business operations, transforms data                         │
│   Depends on: Domain Layer                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Domain Layer                                      │
│                        src/domain/entities/                                 │
│                      src/domain/repositories/                               │
│                        src/domain/services/                                 │
│                         src/domain/enums/                                   │
│                                                                             │
│   Pure business logic, no external dependencies                             │
│   Depends on: Nothing                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                       Infrastructure Layer                                  │
│               src/infrastructure/persistence/                               │
│                 src/infrastructure/external/                                │
│                 src/infrastructure/security/                                │
│                 src/infrastructure/modules/                                 │
│                                                                             │
│   Technical implementations of domain interfaces                            │
│   Depends on: Domain Layer (implements interfaces)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Dependency Flow

```
    API Layer
        │
        ▼
  Application Layer  ◄───── DTOs (Data Transfer Objects)
        │
        ▼
   Domain Layer      ◄───── Entities, Repository Interfaces, Provider Interfaces
        ▲
        │
Infrastructure Layer ────► Implements Domain Interfaces
```

**Key Rule**: Dependencies point inward. Outer layers depend on inner layers, never the reverse.

## Layer Responsibilities

### Domain Layer (`src/domain/`)

The core of the application containing pure business logic.

| Directory       | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `entities/`     | Business objects (User, Business, PaymentLink, etc.) |
| `repositories/` | Interfaces defining data access contracts            |
| `services/`     | Interfaces for external service integrations         |
| `enums/`        | Domain-specific enumerations                         |

**Example Entity:**

```typescript
// src/domain/entities/payment-link.entity.ts
export class PaymentLink {
  constructor(
    public readonly id: string,
    public readonly merchantRef: string,
    public readonly trackingId: string,
    // ... business properties
  ) {}
}
```

**Example Repository Interface:**

```typescript
// src/domain/repositories/payment-link.repo.ts
export interface IPaymentLinkRepository {
  save(paymentLink: PaymentLink): Promise<PaymentLink>;
  findByTrackingId(trackingId: string): Promise<PaymentLink | null>;
  updateStatus(trackingId: string, status: PaymentStatus): Promise<void>;
}
```

### Application Layer (`src/application/`)

Orchestrates use cases and handles data transformation.

| Directory    | Purpose                                                |
| ------------ | ------------------------------------------------------ |
| `use-cases/` | Service classes implementing business operations       |
| `dtos/`      | Request/response data structures for API communication |

**Example Use Case:**

```typescript
// src/application/use-cases/payments/payment.service.ts
@Injectable()
export class PaymentService {
  constructor(
    @Inject('IPaymentLinkRepository')
    private readonly paymentLinkRepo: IPaymentLinkRepository,
    @Inject('IPesapalProvider')
    private readonly pesapalProvider: IPesapalProvider,
  ) {}

  async createPaymentOrder(
    dto: CreatePaymentOrderDto,
  ): Promise<PaymentOrderResponseDto> {
    // Orchestrate the payment creation flow
  }
}
```

### Infrastructure Layer (`src/infrastructure/`)

Provides concrete implementations of domain interfaces.

| Directory      | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `persistence/` | Database schemas and repository implementations |
| `external/`    | Third-party API integrations (PesaPal)          |
| `security/`    | Authentication, encryption, guards              |
| `modules/`     | NestJS module configuration                     |

**Example Repository Implementation:**

```typescript
// src/infrastructure/persistence/repositories/payment-link.repository.ts
@Injectable()
export class PaymentLinkRepository implements IPaymentLinkRepository {
  constructor(
    @InjectModel('PaymentLink') private model: Model<PaymentLinkDocument>,
  ) {}

  async save(paymentLink: PaymentLink): Promise<PaymentLink> {
    const doc = new this.model(paymentLink);
    const saved = await doc.save();
    return this.toEntity(saved);
  }
}
```

### API Layer (`src/api/`)

Handles HTTP concerns and delegates to application services.

| Directory      | Purpose                                  |
| -------------- | ---------------------------------------- |
| `controllers/` | Route handlers, request/response mapping |

**Example Controller:**

```typescript
// src/api/controllers/payment.controller.ts
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.paymentService.createPaymentOrder(dto);
  }
}
```

## Design Patterns

### Repository Pattern

Abstracts data access behind interfaces. Domain layer defines the contract, infrastructure layer provides the implementation.

```
Domain:           IPaymentLinkRepository (interface)
                          ▲
                          │ implements
                          │
Infrastructure:   PaymentLinkRepository (MongoDB implementation)
```

### Provider Pattern

Abstracts external service integrations. Similar to Repository but for external APIs.

```
Domain:           IPesapalProvider (interface)
                          ▲
                          │ implements
                          │
Infrastructure:   PesapalProvider (HTTP implementation)
```

### DTO Pattern

Separates internal domain models from API contracts. Prevents leaking internal structure.

```
API Request ──► CreatePaymentOrderDto ──► PaymentService ──► Domain Entity
                                                                    │
API Response ◄── PaymentOrderResponseDto ◄──────────────────────────┘
```

## Adding New Features

Follow these steps when adding a new feature:

### 1. Define Domain Models

Start with the domain layer. Create entities and repository/provider interfaces.

```bash
# Create entity
src/domain/entities/new-feature.entity.ts

# Create repository interface
src/domain/repositories/new-feature.repo.ts
```

### 2. Create DTOs

Define the API contract in the application layer.

```bash
# Request/Response DTOs
src/application/dtos/new-feature/create-new-feature.dto.ts
src/application/dtos/new-feature/new-feature-response.dto.ts
```

### 3. Implement Use Case

Create the service that orchestrates the feature.

```bash
src/application/use-cases/new-feature/new-feature.service.ts
```

### 4. Implement Infrastructure

Provide concrete implementations.

```bash
# Database schema
src/infrastructure/persistence/schemas/new-feature.schema.ts

# Repository implementation
src/infrastructure/persistence/repositories/new-feature.repository.ts
```

### 5. Create Controller

Expose the feature via HTTP.

```bash
src/api/controllers/new-feature.controller.ts
```

### 6. Wire Up Module

Create or update a NestJS module to connect everything.

```bash
src/infrastructure/modules/new-feature.module.ts
```

### Dependency Injection Setup

In your module, register implementations for interfaces:

```typescript
@Module({
  providers: [
    NewFeatureService,
    {
      provide: 'INewFeatureRepository',
      useClass: NewFeatureRepository,
    },
  ],
})
export class NewFeatureModule {}
```

## Security Architecture

### Authentication Flow

```
Request ──► JwtAuthGuard ──► JwtStrategy ──► Controller
                                  │
                                  ▼
                            JWT Validation
                                  │
                                  ▼
                         User attached to request
```

### Two-Factor Authentication

```
Login ──► Password Check ──► Return JWT (limited)
                                    │
                                    ▼
Verify TOTP ──► TotpVerifiedGuard ──► Full Access
```

### Credential Encryption

PesaPal API credentials are encrypted at rest using AES-256-GCM:

```
Plain Credentials ──► EncryptionService.encrypt() ──► Database
                              │
                              ▼
                      iv:authTag:ciphertext
```

## Key Files Reference

| File                                                      | Purpose                       |
| --------------------------------------------------------- | ----------------------------- |
| `src/main.ts`                                             | Application bootstrap         |
| `src/app.module.ts`                                       | Root module configuration     |
| `src/infrastructure/modules/*.ts`                         | Feature module configurations |
| `src/infrastructure/security/jwt.strategy.ts`             | JWT validation strategy       |
| `src/infrastructure/security/encryption.service.ts`       | Credential encryption         |
| `src/infrastructure/external/pesapal/pesapal.provider.ts` | PesaPal API client            |
