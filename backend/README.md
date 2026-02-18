# Multi-Tenant WhatsApp Notification Backend

A production-ready, multi-tenant backend for WhatsApp notifications and escalations. Built with Node.js, Express, and PostgreSQL.

## Features

- **Multi-Tenancy**: Data isolation per tenant using `tenant_id`.
- **RBAC Authentication**: RS256 JWT-based auth with `SUPER_ADMIN`, `ADMIN`, and `SUB_ADMIN` roles.
- **Financial Integrity**: Atomic debit/credit transactions with row locking (`FOR UPDATE`) to prevent race conditions.
- **Scheduler**: `node-cron` integrated for just-in-time message dispatching.
- **Resilience**: Webhook handling with auto-refund logic on delivery failures.

## Prerequisites

- **Node.js**: v20+
- **PostgreSQL**: v14+

> **Deep Dive**: For a detailed look at the financial logic, schema, and architecture, see the [Technical Guide](TECHNICAL_GUIDE.md).

## Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env` and update your database credentials:
    ```bash
    cp .env.example .env
    ```

3.  **Database Initialization**
    This script creates the database (if missing) and applies the schema:
    ```bash
    node src/db/init.js
    ```

4.  **Start Server**
    ```bash
    npm run dev
    ```
    *Server runs on port 3000 by default.*

5.  **Verify Installation**
    Run the end-to-end test script to simulate a full flow (Tenant registration -> Template creation -> Message scheduling):
    ```bash
    node scripts/test_flow.js
    ```

---

## API Documentation

**Base URL**: `http://localhost:3000`

### 1. Authentication
**POST** `/auth/register-tenant`
Registers a new tenant and an Admin user.
```json
{
  "tenantName": "Acme Corp",
  "slug": "acme-corp",
  "adminEmail": "admin@acme.com",
  "adminPassword": "password123",
  "adminName": "John Doe"
}
```

**POST** `/auth/login`
Logs in a user and returns a JWT.
```json
{
  "email": "admin@acme.com",
  "password": "password123"
}
```

### 2. Contacts
**POST** `/contacts/import`
Bulk import contacts. Duplicates are skipped.
```json
{
  "contacts": [
    { "phone": "+15551234567", "name": "Alice", "attributes": { "city": "NY" } },
    { "phone": "+15559876543", "name": "Bob" }
  ]
}
```

**GET** `/contacts`
Retrieve all contacts for the authenticated tenant.

### 3. Templates
**POST** `/templates`
Create a new message template.
```json
{
  "name": "welcome_message",
  "content": "Hello {{1}}, welcome!",
  "variables": ["name"],
  "metaTemplateId": "meta_12345",
  "status": "APPROVED" 
}
```

**GET** `/templates`
List all templates.

### 4. Messages (Scheduling)
**POST** `/messages/schedule`
Schedule a message. Funds are checked at dispatch time.
```json
{
  "templateId": "uuid-of-template",
  "contactId": "uuid-of-contact",
  "scheduleTime": "2024-12-31T10:00:00Z",
  "idempotencyKey": "unique-request-id"
}
```

### 5. Billing
**POST** `/billing/add-credits`
*Requires `SUPER_ADMIN` role.*
```json
{
  "tenantId": "uuid-of-tenant",
  "amount": 100.00,
  "description": "Initial top-up"
}
```

### 6. Webhooks
**POST** `/webhook/meta`
Receives status updates from Meta (Sent, Delivered, Failed).
*Triggers automatic refund if status is `failed`.*

**GET** `/webhook/meta`
Meta Webhook verification challenge endpoint.

---

## Architecture Highlights

### Folder Structure
```
src/
├── config/         # Config files
├── db/             # Database connection & schema
├── middleware/     # Auth, Error handling, Tenant context
├── modules/        # Domain modules (Controller/Service/Repo pattern)
│   ├── auth/
│   ├── billing/
│   ├── contacts/
│   ├── messages/
│   ├── templates/
│   ├── tenants/
│   └── webhook/
├── scheduler/      # Cron jobs for message dispatch
└── server.js       # Entry point
```

### Financial Flow
1.  **Schedule**: Message job created (Status: `PENDING`). No funds deducted yet.
2.  **Dispatch (Cron)**:
    -   `BEGIN TRANSACTION`
    -   Lock Tenant Balance (`SELECT FOR UPDATE`)
    -   Check Funds >= Cost
    -   Deduct Balance
    -   Insert Ledger Entry (`DEBIT`, `PENDING`)
    -   `COMMIT`
3.  **Delivery**:
    -   If Webhook receives `failed`:
        -   `BEGIN TRANSACTION`
        -   Refund Balance
        -   Insert Ledger Entry (`CREDIT`, `REFUND`)
        -   `COMMIT`

### Working Routes Summary

**Base URL**: `http://localhost:3000`

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register-tenant` | Register Tenant & Admin (Auto-login) |
| | `POST` | `/auth/login` | Login & Get JWT |
| **Contacts** | `POST` | `/contacts/import` | Bulk Import Contacts |
| | `GET` | `/contacts` | List All Contacts |
| **Templates** | `POST` | `/templates` | Create Template (Status: APPROVED) |
| | `GET` | `/templates` | List All Templates |
| **Messages** | `POST` | `/messages/schedule` | Schedule Message (Funds checked on dispatch) |
| **Billing** | `POST` | `/billing/add-credits` | Manual Top-up (Super Admin Only) |
| **Webhook** | `POST` | `/webhook/meta` | Meta Status Updates (Sent/Delivered/Failed) |
