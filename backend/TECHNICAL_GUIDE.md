# Technical Guide & Architecture

This document provides a deep dive into the implementation details of the Miping WhatsApp Notification Backend.

## 1. Database Schema Overview

The database is robustly designed for multi-tenancy and high data integrity.

### Core Tables
*   **Tenants**: Roots of the system. Stores `balance` (for billing) and `settings` (JSONB for extensibility).
*   **Users**: RBAC-enabled users linked to Tenants. Roles: `SUPER_ADMIN`, `ADMIN`, `SUB_ADMIN`.
*   **Contacts**: Phone book per tenant. Phone numbers are normalized to E.164.

### Messaging & Templates
*   **Templates**: Stores WhatsApp templates. Status flow: `PENDING` -> `APPROVED` (mocked for MVP).
*   **Message Jobs**: The central transactional record for a message request.
    *   **Status Lifecycle**: `PENDING` -> `PROCESSING` -> `SENT` -> `DELIVERED` / `FAILED`.
    *   **Idempotency**: Enforced via `unique(tenant_id, idempotency_key)`.

### Financial Engine (Crucial)
*   **Credit Transactions**: An **Immutable Ledger**.
    *   Every balance change is recorded here.
    *   Includes `start_balance`, `amount`, `end_balance`, `type`, and `reference_id`.
    *   This allows full auditability of the system.

## 2. Authentication Flow

We use a stateless, secure JWT architecture.

1.  **Registration**:
    *   Creates a `Tenant`.
    *   Creates an `ADMIN` user.
    *   **Auto-login**: Immediately issues a JWT RS256 token signed with the server's Private Key.
2.  **Login**:
    *   Verifies email/password (bcrypt).
    *   Issues JWT containing `tenant_id`, `role`, and `user_id`.
3.  **Protection**:
    *   Middleware verifies the JWT signature using the Public Key.
    *   Extracts `tenant_id` and attaches it to `req.tenant`.
    *   **Isolation**: All subsequent DB queries use this `req.tenant.id` to filter data.

## 3. Financial Integrity Model

We strictly enforce atomic transactions to prevent double-spending or race conditions.

### Debit Process (Message Scheduling/sending)
Occurs when the **Dispatcher** picks up a job:
1.  **BEGIN Transaction**
2.  **LOCK**: `SELECT balance FROM tenants WHERE id = $1 FOR UPDATE`.
    *   *This locks the tenant row, forcing other transactions to wait.*
3.  **CHECK**: If `balance < cost`, throw error.
4.  **UPDATE**: `UPDATE tenants SET balance = balance - cost`.
5.  **LOG**: Insert into `credit_transactions` (Type: `DEBIT`).
6.  **COMMIT Transaction**

### Refund Process (Delivery Failure)
Occurs via **Webhook**:
1.  **BEGIN Transaction**
2.  **LOCK**: `SELECT balance ... FOR UPDATE`.
3.  **UPDATE**: `UPDATE tenants SET balance = balance + cost`.
4.  **LOG**: Insert into `credit_transactions` (Type: `REFUND`).
5.  **COMMIT Transaction**

## 4. Message Lifecycle & Scheduler

### Phase 1: Scheduling
*   API Request -> Validates Inputs -> Creates `message_jobs` row (Status: `PENDING`).
*   **No funds deducted yet.** This ensures high write throughput on the API.

### Phase 2: Dispatching (The Cron Job)
*   Runs every minute (configurable).
*   Finds `PENDING` jobs scheduled for `NOW()` or past.
*   **Concurrency**:
    *   Loops through jobs.
    *   Performs the **Debit Process** (see above).
    *   If successful, sends payload to mock Meta API.
    *   Updates status to `SENT`.
    *   If insufficient funds, updates status to `FAILED`.

### Phase 3: Delivery Reporting
*   **Webhook Endpoint**: `/webhook/meta`
*   Receives `SENT`, `DELIVERED`, `READ`, or `FAILED` events.
*   Updates `messages` table status.
*   **Auto-Refund**: If status is `FAILED`, triggers the **Refund Process**.

## 5. Security Measures

*   **JWT RS256**: Asymmetric signing ensures tokens cannot be forged even if the shared secret (if we used generic HMAC) was compromised.
*   **Helmet**: Sets standard security HTTP headers.
*   **CORS**: Configured to deny unauthorized cross-origin requests (default safe).
*   **Input Handling**: `express.json()` and `express.urlencoded()` with limits to prevent payload bloat attacks.
*   **Parameter Pollution**: Custom Logic/Libraries can be added, currently explicit parameter extraction is used.

## 6. How to Extend

*   **Real Meta API**: Replace the mock logic in `src/modules/messages/service.js`.
*   **Payment Gateway**: Implement a webhook listener for Stripe/Razorpay to call `billingService.addCredits`.
