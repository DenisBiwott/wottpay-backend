# WottPay Backend

A payment processing backend built with NestJS, integrating with PesaPal payment gateway. Built using Clean Architecture principles for maintainability and testability.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
│                    (Controllers, Guards)                        │
├─────────────────────────────────────────────────────────────────┤
│                      Application Layer                          │
│                   (Use Cases, DTOs, Services)                   │
├─────────────────────────────────────────────────────────────────┤
│                        Domain Layer                             │
│            (Entities, Repository Interfaces, Enums)             │
├─────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                        │
│     (Database, External APIs, Security, Module Configuration)   │
└─────────────────────────────────────────────────────────────────┘
```

**Layer Responsibilities:**

- **API**: HTTP request handling, authentication guards, route definitions
- **Application**: Business logic orchestration, data transformation (DTOs)
- **Domain**: Core business entities, repository contracts, enums
- **Infrastructure**: Technical implementations (MongoDB, PesaPal, JWT, encryption)

## Tech Stack

| Technology         | Purpose                     |
| ------------------ | --------------------------- |
| NestJS 11          | Application framework       |
| MongoDB + Mongoose | Database and ODM            |
| Passport + JWT     | Authentication              |
| RBAC               | Role-Based Access Control   |
| TOTP (otplib)      | Two-factor authentication   |
| Axios              | HTTP client for PesaPal API |
| bcrypt             | Password hashing            |
| class-validator    | Request validation          |

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB 6+
- PesaPal merchant account (for payment processing)

## Environment Variables

| Variable           | Description                              | Required                 |
| ------------------ | ---------------------------------------- | ------------------------ |
| `MONGODB_URI`      | MongoDB connection string                | Yes                      |
| `JWT_SECRET`       | Secret key for JWT token signing         | Yes                      |
| `JWT_EXPIRES_IN`   | JWT token expiration (e.g., `1h`, `7d`)  | Yes                      |
| `ENCRYPTION_KEY`   | Key for encrypting sensitive credentials | Yes                      |
| `PESAPAL_BASE_URL` | PesaPal API base URL                     | No (defaults to sandbox) |

Copy `.env.example` to `.env` and configure your values.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Endpoints

### Authentication

| Method | Endpoint            | Description      |
| ------ | ------------------- | ---------------- |
| POST   | `/auth/login`       | User login       |
| POST   | `/auth/setup-totp`  | Setup 2FA        |
| POST   | `/auth/verify-totp` | Verify TOTP code |

### Users (Admin Only)

Every user must be associated with a business. The `businessId` field is required when creating a user and links the user to their organization. User management is restricted to ADMIN role only.

| Method | Endpoint     | Description                             | Role Required |
| ------ | ------------ | --------------------------------------- | ------------- |
| POST   | `/users`     | Create user (requires `businessId`)     | ADMIN         |
| GET    | `/users`     | List users for your business            | ADMIN         |
| GET    | `/users/:id` | Get user by ID (includes business info) | ADMIN         |
| PUT    | `/users/:id` | Update user (can reassign `businessId`) | ADMIN         |
| DELETE | `/users/:id` | Delete user                             | ADMIN         |

### Businesses

Businesses are organizations that can have multiple users associated with them. A business cannot be deleted if it has associated users.

| Method | Endpoint                      | Description                            |
| ------ | ----------------------------- | -------------------------------------- |
| POST   | `/businesses`                 | Create business                        |
| GET    | `/businesses/:id`             | Get business                           |
| PUT    | `/businesses/:id`             | Update business                        |
| DELETE | `/businesses/:id`             | Delete business (fails if users exist) |
| PATCH  | `/businesses/:id/credentials` | Update PesaPal credentials             |

### Payments

| Method | Endpoint                               | Description                       | Role Required              |
| ------ | -------------------------------------- | --------------------------------- | -------------------------- |
| POST   | `/payments/orders`                     | Create payment order              | ADMIN, MERCHANT            |
| GET    | `/payments/orders/:trackingId`         | Get order by tracking ID          | ADMIN, MERCHANT, READ_ONLY |
| GET    | `/payments/transactions`               | List transactions with filters    | ADMIN, MERCHANT, READ_ONLY |
| GET    | `/payments/links`                      | List payment links with filters   | ADMIN, MERCHANT, READ_ONLY |
| GET    | `/payments/links/:id/with-transaction` | Get payment link with transaction | ADMIN, MERCHANT, READ_ONLY |
| GET    | `/payments/status`                     | Get transaction status            | ADMIN, MERCHANT, READ_ONLY |
| POST   | `/payments/cancel`                     | Cancel order                      | ADMIN, MERCHANT            |
| POST   | `/payments/ipn/register`               | Register IPN endpoint             | ADMIN                      |
| GET    | `/payments/ipn/list/:businessId`       | Get registered IPNs               | ADMIN, MERCHANT, READ_ONLY |
| POST   | `/payments/ipn/callback`               | Handle IPN callback (Public)      | -                          |

### Insights

| Method | Endpoint    | Description           | Role Required              |
| ------ | ----------- | --------------------- | -------------------------- |
| GET    | `/insights` | Get business insights | ADMIN, MERCHANT, READ_ONLY |

### Event Logs (Admin Only)

| Method | Endpoint      | Description                  | Role Required |
| ------ | ------------- | ---------------------------- | ------------- |
| GET    | `/event-logs` | List event logs for business | ADMIN         |

## NPM Scripts

| Script                | Description              |
| --------------------- | ------------------------ |
| `npm run start:dev`   | Start with hot reload    |
| `npm run start:debug` | Start with debugger      |
| `npm run start:prod`  | Start production build   |
| `npm run build`       | Build TypeScript         |
| `npm run lint`        | Run ESLint with auto-fix |
| `npm run format`      | Run Prettier             |
| `npm run test`        | Run unit tests           |
| `npm run test:e2e`    | Run end-to-end tests     |
| `npm run test:cov`    | Run tests with coverage  |

## Project Structure

```
src/
├── api/                          # API Layer
│   └── controllers/              # HTTP request handlers
├── application/                  # Application Layer
│   ├── dtos/                     # Data Transfer Objects
│   │   ├── auth/                 # Auth-related DTOs
│   │   ├── business/             # Business DTOs
│   │   ├── pesapal/              # PesaPal integration DTOs
│   │   └── user/                 # User DTOs
│   └── use-cases/                # Business logic services
│       ├── auth/                 # Authentication use cases
│       ├── businesses/           # Business management
│       ├── payments/             # Payment processing
│       └── users/                # User management
├── domain/                       # Domain Layer
│   ├── entities/                 # Domain entities
│   ├── enums/                    # Domain enumerations
│   ├── repositories/             # Repository interfaces
│   └── services/                 # Provider interfaces
├── infrastructure/               # Infrastructure Layer
│   ├── external/                 # External API integrations
│   │   └── pesapal/              # PesaPal provider
│   ├── modules/                  # NestJS module definitions
│   ├── persistence/              # Database layer
│   │   ├── repositories/         # Repository implementations
│   │   └── schemas/              # Mongoose schemas
│   └── security/                 # Auth, encryption, guards
├── app.module.ts                 # Root module
└── main.ts                       # Application entry point
```

## Role-Based Access Control (RBAC)

WottPay implements a role-based access control system with three user roles:

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

## Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - Detailed architecture documentation
- [Authentication Guide](./docs/AUTHENTICATION.md) - Authentication and authorization documentation
- [Deploy & CI/CD Guide](./docs/DEPLOY-ARCHITECTURE.md) - Deploy, server structure & CI/CD documetation

## License

UNLICENSED - Private repository
_Biwott 2026_
