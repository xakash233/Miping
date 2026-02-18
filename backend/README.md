# Multi-Tenant WhatsApp Notification Backend

A production-ready, multi-tenant backend for WhatsApp notifications and escalations. Built with Node.js, Express, and PostgreSQL.

## 🚀 Features

### 1. Super Admin (Platform Owner)
- **Subscription Management**: Define plans (Starter, Pro, Enterprise) with limits.
- **Tenant Provisioning**: Create tenants and assign plans manually.
- **Automated Onboarding**: System sends welcome emails with credentials to new tenants.

### 2. Tenant (Business Owner)
- **WhatsApp Integration**: 
    - **Connect**: One-click OAuth connection to WhatsApp Business.
    - **Templates**: Create, Edit, and Sync templates with Meta.
    - **Messaging**: Send campaigns and viewing history.
- **Plan View**: View current subscription details and limits.

### 3. Developer / API
- **Modular Architecture**: Separate modules for `auth`, `plans`, `tenants`, `whatsapp`.
- **Live Sync**: Webhooks handle real-time status updates from Meta (Templates, Messages).

## 🛠 Setup & Configuration

### Prerequisites
1.  **PostgreSQL**: Ensure DB is running.
2.  **Redis**: For queuing (optional but recommended).
3.  **Meta App**: Created in Facebook Developers Console.

### Environment Variables (.env)
```env
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whatsapp_backend

# Authentication
JWT_PRIVATE_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem

# Encryption (32 chars)
AES_SECRET=super_secret_aes_key_32_chars_12

# Meta / WhatsApp
META_API_VERSION=v19.0
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Running the App
1.  **Install**: `npm install`
2.  **Migrate**: `node scripts/run_migration.js` (Run for all migration files)
3.  **Start**: `npm run dev`

### API Documentation
- **Plans**: `GET /plans`, `POST /plans` (Admin)
- **Tenants**: `POST /admin/create-tenant` (Admin)
- **WhatsApp**: `POST /whatsapp/connect` (OAuth Code) 

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
