# Miping - Project Roadmap & Architecture

This document outlines the architecture and implementation plan for the Miping WhatsApp SaaS Platform, covering Super Admin subscription management, Tenant onboarding, and API integration.

## 1. User Roles & Workflows

### A. Super Admin (Platform Owner)
*   **Subscription Management**:
    *   Create, View, Update, Delete Subscription Plans (e.g., "Lite", "Pro", "Enterprise").
    *   Plans define limits (message quotas, contact limits).
*   **Tenant Provisioning**:
    *   Super Admin receives payment off-platform (e.g., Paytm).
    *   Manually creates a new Tenant/Admin User.
    *   Assigns a Subscription Plan to the Tenant.
    *   **System Action**: Sends an email to the new Admin with login credentials.

### B. Admin (Tenant/Business Owner)
*   **Onboarding**:
    *   Logs in with provided credentials.
    *   **"Connect WhatsApp"**: Uses Meta Embedded Signup (OAuth/Popup) to connect their WhatsApp Business Number.
    *   System automatically fetches and stores WABA ID, Phone Number ID, and Access Token securely.
*   **Operation**:
    *   **Template Management**: Create templates with sync (Auto-Approved/Rejected status reflection).
    *   **Contacts**: Import/Add contacts manually or via API.
    *   **Sending Messages**: Send campaigns using approved templates.
*   **API Access**:
    *   Generate API Keys.
    *   Push data from external systems (e.g., College ERP) to trigger messages.

## 2. Technical Architecture

### Database Schema Updates (Planned)
*   `plans`: id, name, price, message_limit, etc.
*   `subscriptions`: tenant_id, plan_id, start_date, end_date, active.
*   `api_keys`: tenant_id, key_hash, created_at.

### WhatsApp Integration (Embedded Signup)
*   **Frontend**: 
    *   Load Facebook JS SDK.
    *   Launch `FB.login` with `whatsapp_business_management` scope.
    *   Receive `code` from popup.
*   **Backend**:
    *   `POST /whatsapp/oauth/callback`: Exchange `code` for `access_token`.
    *   Fetch WABA ID & Phone Number ID using the token.
    *   Store encrypted credentials in `whatsapp_accounts` table.
    *   Register Webhook automatically (`POST /subscribed_apps`).

### API for External Systems
*   **Endpoint**: `POST /api/v1/trigger-message`
*   **Auth**: `x-api-key` header.
*   **Payload**:
    ```json
    {
      "phone": "+919876543210",
      "template_name": "fee_reminder",
      "variables": ["John", "5000"]
    }
    ```

## 3. Implementation Steps

1.  **Template Sync** (Completed): Auto-sync status and deletions from Meta.
2.  **Super Admin Module**:
    *   Create `plans` table.
    *   API: `POST /plans`, `GET /plans`.
    *   Update `POST /tenants` to include Plan assignment and Email triggering.
3.  **WhatsApp "Connect" Flow**:
    *   Backend `oauth` endpoints.
    *   Frontend "Connect with Facebook" button.
4.  **External API Layer**:
    *   API Key generation UI.
    *   Middleware to validate Keys.
    *   Public facing message trigger endpoint.

## 4. Environment Variables Required
*   `FACEBOOK_APP_ID`: (Already Added)
*   `FACEBOOK_APP_SECRET`: (Already Added)
*   `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: For sending credential emails.

