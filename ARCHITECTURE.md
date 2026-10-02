# STECHA Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     STECHA Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (Next.js 14 + React 19)                    │  │
│  │  - User Interface                                    │  │
│  │  - Authentication Flow                               │  │
│  │  - Real-time Chat (AI Integration)                   │  │
│  │  - Analytics Dashboard                               │  │
│  │  - Admin & Restaurant Owner Panels                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Gateway (FastAPI + Uvicorn)                     │  │
│  │  - REST Endpoints                                    │  │
│  │  - Authentication (JWT)                              │  │
│  │  - Request Validation                                │  │
│  │  - CORS Handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer (Microservices)                │  │
│  │  ├─ Authentication Service                           │  │
│  │  ├─ Chat/AI Service                                  │  │
│  │  ├─ Reservation Service                              │  │
│  │  ├─ Pre-Order Service                                │  │
│  │  ├─ Document Service                                 │  │
│  │  ├─ Payment Service (Stripe)                         │  │
│  │  ├─ Admin Service                                    │  │
│  │  └─ Analytics Service                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer (SQLAlchemy ORM)                         │  │
│  │  - User Management                                   │  │
│  │  - Business Profiles                                 │  │
│  │  - Orders & Reservations                             │  │
│  │  - Messages & Conversations                          │  │
│  │  - Documents & Files                                 │  │
│  │  - Payments & Subscriptions                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Persistence Layer                                   │  │
│  │  ├─ PostgreSQL (Production Database)                 │  │
│  │  ├─ SQLite (Development)                             │  │
│  │  ├─ Redis (Caching, Sessions)                        │  │
│  │  └─ S3/Cloud Storage (Files)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  External Services                                   │  │
│  │  ├─ Anthropic Claude API (AI/Chat)                   │  │
│  │  ├─ Stripe (Payments)                                │  │
│  │  ├─ Google Places API (Locations)                    │  │
│  │  └─ Email Service (Notifications)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks, Context API
- **API Client**: Fetch API
- **Build**: Next.js Compiler

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn (ASGI)
- **Language**: Python 3.11
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT + python-jose
- **Hashing**: bcrypt

### Database
- **Production**: PostgreSQL 15
- **Development**: SQLite
- **Migrations**: Alembic
- **ORM**: SQLAlchemy

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Version Control**: Git

## Data Models

### Core Entities

```
User
├── id (UUID)
├── email (String, unique)
├── password_hash (String)
├── full_name (String)
├── phone_number (String)
├── is_active (Boolean)
├── is_admin (Boolean)
├── created_at (DateTime)
└── updated_at (DateTime)

Business
├── id (UUID)
├── user_id (FK → User)
├── name (String)
├── description (Text)
├── category (String)
├── location (String)
├── phone (String)
├── is_approved (Boolean)
├── is_suspended (Boolean)
└── created_at (DateTime)

Conversation
├── id (UUID)
├── user_id (FK → User)
├── title (String)
├── created_at (DateTime)
└── messages (One-to-Many → Message)

Message
├── id (UUID)
├── conversation_id (FK → Conversation)
├── role (String: user/assistant)
├── content (Text)
├── created_at (DateTime)

PreOrder
├── id (UUID)
├── user_id (FK → User)
├── business_id (FK → Business)
├── items (JSON Array)
├── pickup_date (DateTime)
├── status (Enum)
├── total_price (Float)
├── created_at (DateTime)

Reservation
├── id (UUID)
├── user_id (FK → User)
├── business_id (FK → Business)
├── guest_count (Integer)
├── reservation_date (DateTime)
├── status (Enum)
├── created_at (DateTime)

Document
├── id (UUID)
├── user_id (FK → User)
├── filename (String)
├── file_path (String)
├── file_size (Integer)
├── mime_type (String)
├── created_at (DateTime)

Payment
├── id (UUID)
├── user_id (FK → User)
├── amount (Float)
├── currency (String)
├── status (Enum)
├── stripe_payment_id (String)
├── created_at (DateTime)
```

## API Architecture

### Endpoint Organization

```
/api/v1/
├── /auth/
│   ├── POST /register
│   ├── POST /login
│   ├── GET /me
│   ├── POST /change-password
│   └── DELETE /logout
├── /chat/
│   ├── POST /
│   └── POST /stream
├── /conversations/
│   ├── GET / (list)
│   ├── POST / (create)
│   ├── GET /{id}
│   ├── PATCH /{id}
│   └── DELETE /{id}
├── /reservations/
│   ├── GET / (list)
│   ├── POST / (create)
│   ├── GET /{id}
│   ├── PATCH /{id}
│   └── POST /{id}/cancel
├── /pre-orders/
│   ├── GET / (list)
│   ├── POST / (create)
│   ├── GET /{id}
│   ├── PATCH /{id}
│   └── POST /{id}/cancel
├── /documents/
│   ├── GET / (list)
│   ├── POST /upload
│   ├── GET /{id}
│   ├── PUT /{id}
│   └── DELETE /{id}
├── /payments/
│   ├── GET /plans
│   ├── POST /checkout-session
│   ├── GET /subscription
│   └── POST /webhook
├── /admin/
│   ├── GET /users
│   ├── GET /businesses
│   ├── GET /metrics
│   └── POST /approve/{resource}
├── /restaurant/
│   ├── GET /my-business
│   ├── PUT /my-business
│   ├── GET /reservations
│   └── GET /pre-orders
└── /analytics/
    ├── GET /dashboard
    ├── GET /metrics/summary
    └── GET /usage-summary
```

## Authentication Flow

```
1. User Registration
   ├── POST /api/v1/auth/register
   ├── Validate email & password
   ├── Hash password (bcrypt)
   ├── Create user record
   └── Return user info

2. Login
   ├── POST /api/v1/auth/login
   ├── Verify credentials
   ├── Generate JWT token
   └── Return token + user info

3. Protected Requests
   ├── Client: Include Authorization header
   ├── "Authorization: Bearer <jwt_token>"
   ├── Server: Verify JWT signature
   ├── Extract user info from JWT
   └── Process request

4. Token Expiration
   ├── JWT expires after 24 hours (configurable)
   ├── Client: Redirect to login
   ├── Server: Return 401 Unauthorized
```

## Service Architecture

### Auth Service
- User registration & login
- Password hashing (bcrypt)
- JWT token generation & validation
- Session management

### Chat Service
- Real-time conversation management
- AI integration with Claude API
- Message streaming
- Conversation history

### Reservation Service
- CRUD operations for reservations
- Date/time validation
- Status management
- Business approval workflow

### Pre-Order Service
- CRUD operations for pre-orders
- Item validation
- Pricing calculation
- Status tracking

### Payment Service
- Stripe integration
- Payment processing
- Webhook handling
- Subscription management

### Document Service
- File upload/download
- Storage management
- Access control
- File validation

### Admin Service
- User management
- Business approval
- Metrics & analytics
- Content moderation

## Deployment Architecture

```
GitHub Repository
  └─ Push to branch
     └─ GitHub Actions
        ├─ Backend Tests (68 tests)
        ├─ Frontend Build (26 routes)
        ├─ Security Checks
        │  ├─ Trivy scanning
        │  ├─ TruffleHog secrets
        │  └─ Dependency audit
        └─ Health Checks
           ├─ DB migrations
           ├─ API routes
           └─ Build cache

Docker Registry
  └─ Push images
     └─ Deployment
        ├─ Backend Container
        ├─ Frontend Container
        ├─ PostgreSQL Container
        └─ Redis Container (optional)
```

## Security Model

- **Authentication**: JWT (HS256)
- **Password Hashing**: bcrypt (12 rounds)
- **CORS**: Configured for frontend origin
- **Input Validation**: Pydantic v2
- **SQL Injection Protection**: Parameterized queries
- **Secret Management**: Environment variables
- **HTTPS**: Required in production
- **Dependency Security**: Regular audits

## Performance Considerations

- **Caching**: Redis for session/cache
- **Database Indexing**: On frequently queried columns
- **API Pagination**: Configurable page size
- **Asset Optimization**: Next.js image optimization
- **Database Pooling**: Connection pooling configured
- **Code Splitting**: Route-based code splitting

## Monitoring & Logging

- **Application Logs**: Structured logging
- **Error Tracking**: Sentry integration (optional)
- **Performance Monitoring**: APM tools
- **Database Monitoring**: Query logging
- **API Monitoring**: Request/response logging
- **CI/CD Monitoring**: GitHub Actions logs
