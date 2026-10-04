# STECHA API Documentation

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://api.yourdomain.com`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Get Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

## Core Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}

Response: 201 Created
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### Change Password
```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "currentpassword",
  "new_password": "newpassword"
}

Response: 200 OK
```

### Conversation Endpoints

#### List Conversations
```http
GET /api/v1/conversations
Authorization: Bearer <token>

Response: 200 OK
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Project Discussion",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-02T00:00:00Z"
    }
  ]
}
```

#### Create Conversation
```http
POST /api/v1/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Project"
}

Response: 201 Created
{
  "id": "uuid",
  "title": "New Project",
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### Get Conversation History
```http
GET /api/v1/conversations/{conversation_id}/history
Authorization: Bearer <token>

Response: 200 OK
{
  "conversation_id": "uuid",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello",
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hi there!",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Chat Endpoints

#### Send Chat Message
```http
POST /api/v1/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation_id": "uuid",
  "message": "What is the weather today?"
}

Response: 200 OK
{
  "message_id": "uuid",
  "response": "I don't have access to real-time weather data...",
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### Stream Chat Message
```http
POST /api/v1/chat/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation_id": "uuid",
  "message": "Explain quantum computing"
}

Response: 200 OK (Server-Sent Events)
data: {"chunk": "Quantum computing..."}
data: {"chunk": " is a field of..."}
```

### Reservation Endpoints

#### List Reservations
```http
GET /api/v1/reservations
Authorization: Bearer <token>

Query Parameters:
- status: pending|confirmed|completed|cancelled
- page: 1
- limit: 10

Response: 200 OK
{
  "reservations": [
    {
      "id": "uuid",
      "business_id": "uuid",
      "guest_count": 4,
      "reservation_date": "2026-02-01T19:00:00Z",
      "status": "confirmed",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 15,
  "page": 1
}
```

#### Create Reservation
```http
POST /api/v1/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "business_id": "uuid",
  "guest_count": 4,
  "reservation_date": "2026-02-01T19:00:00Z"
}

Response: 201 Created
{
  "id": "uuid",
  "business_id": "uuid",
  "guest_count": 4,
  "reservation_date": "2026-02-01T19:00:00Z",
  "status": "pending",
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### Update Reservation
```http
PATCH /api/v1/reservations/{reservation_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "guest_count": 5,
  "reservation_date": "2026-02-02T19:00:00Z"
}

Response: 200 OK
```

#### Cancel Reservation
```http
POST /api/v1/reservations/{reservation_id}/cancel
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "status": "cancelled"
}
```

### Pre-Order Endpoints

#### List Pre-Orders
```http
GET /api/v1/pre-orders
Authorization: Bearer <token>

Query Parameters:
- status: pending|confirmed|completed|cancelled
- page: 1
- limit: 10

Response: 200 OK
{
  "pre_orders": [
    {
      "id": "uuid",
      "business_id": "uuid",
      "items": ["item1", "item2"],
      "pickup_date": "2026-02-01T14:00:00Z",
      "total_price": 49.99,
      "status": "confirmed",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1
}
```

#### Create Pre-Order
```http
POST /api/v1/pre-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "business_id": "uuid",
  "items": ["Pizza Margherita", "Caesar Salad"],
  "pickup_date": "2026-02-01T14:00:00Z"
}

Response: 201 Created
{
  "id": "uuid",
  "business_id": "uuid",
  "items": ["Pizza Margherita", "Caesar Salad"],
  "pickup_date": "2026-02-01T14:00:00Z",
  "total_price": 35.99,
  "status": "pending"
}
```

### Document Endpoints

#### Upload Document
```http
POST /api/v1/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: <binary file>

Response: 201 Created
{
  "id": "uuid",
  "filename": "document.pdf",
  "file_size": 1024,
  "mime_type": "application/pdf",
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### List Documents
```http
GET /api/v1/documents/
Authorization: Bearer <token>

Response: 200 OK
{
  "documents": [
    {
      "id": "uuid",
      "filename": "document.pdf",
      "file_size": 1024,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### Delete Document
```http
DELETE /api/v1/documents/{document_id}
Authorization: Bearer <token>

Response: 204 No Content
```

### Payment Endpoints

#### Get Payment Plans
```http
GET /api/v1/payments/plans
Authorization: Bearer <token>

Response: 200 OK
{
  "plans": [
    {
      "id": "plan_basic",
      "name": "Basic",
      "price": 9.99,
      "period": "monthly",
      "features": ["Feature 1", "Feature 2"]
    }
  ]
}
```

#### Create Checkout Session
```http
POST /api/v1/payments/checkout-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_id": "plan_basic",
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel"
}

Response: 200 OK
{
  "session_id": "session_id",
  "checkout_url": "https://checkout.stripe.com/..."
}
```

#### Get Subscription
```http
GET /api/v1/payments/subscription
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "subscription_id",
  "plan_id": "plan_basic",
  "status": "active",
  "current_period_end": "2026-02-01T00:00:00Z",
  "amount": 9.99
}
```

### Admin Endpoints

#### Get All Users
```http
GET /api/v1/admin/users
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 100
}
```

#### Get Admin Metrics
```http
GET /api/v1/admin/metrics
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "total_users": 1000,
  "total_businesses": 100,
  "total_reservations": 5000,
  "total_pre_orders": 3000,
  "revenue": 50000.00
}
```

### Analytics Endpoints

#### Get Dashboard Analytics
```http
GET /api/v1/analytics/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "total_conversations": 10,
  "total_messages": 150,
  "average_response_time": 2.5,
  "user_satisfaction": 4.5
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Rate limits are applied per user:
- 100 requests per minute for standard users
- 1000 requests per minute for premium users

Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640988000
```

## Pagination

List endpoints support pagination:

```
GET /api/v1/reservations?page=2&limit=20

Query Parameters:
- page: Page number (1-indexed)
- limit: Items per page (1-100, default: 10)

Response:
{
  "data": [...],
  "total": 100,
  "page": 2,
  "limit": 20,
  "pages": 5
}
```

## Versioning

API endpoints are versioned. Current version: `v1`

Future versions will use: `/api/v2/...`

Backwards compatibility will be maintained across major versions.
