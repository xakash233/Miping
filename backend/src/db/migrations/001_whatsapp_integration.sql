-- 1. Create WhatsApp Accounts Table
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    waba_id VARCHAR(50) NOT NULL,
    phone_number_id VARCHAR(50) NOT NULL,
    business_account_id VARCHAR(50) NOT NULL,
    access_token_enc TEXT NOT NULL, -- AES-256-GCM Encrypted
    token_iv VARCHAR(32) NOT NULL, -- Initialization Vector
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    messaging_tier VARCHAR(20) DEFAULT 'TIER_1K',
    quality_rating VARCHAR(10) DEFAULT 'GREEN',
    tier_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, phone_number_id)
);

-- 2. Create Webhook Idempotency Table
CREATE TABLE IF NOT EXISTS webhook_idempotency (
    event_id VARCHAR(100) NOT NULL,
    tenant_id UUID NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (tenant_id, event_id)
);

-- 3. Update Messages Table (State Machine Support)
DO $$
BEGIN
    -- Add wa_account_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'wa_account_id') THEN
        ALTER TABLE messages ADD COLUMN wa_account_id UUID REFERENCES whatsapp_accounts(id);
    END IF;

    -- Add recipient_phone column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_phone') THEN
        ALTER TABLE messages ADD COLUMN recipient_phone VARCHAR(20);
    END IF;

    -- Add cost column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'cost') THEN
        ALTER TABLE messages ADD COLUMN cost NUMERIC(10, 4) DEFAULT 0.0000;
    END IF;

    -- Add error_code column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'error_code') THEN
        ALTER TABLE messages ADD COLUMN error_code VARCHAR(20);
    END IF;

    -- Add error_desc column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'error_desc') THEN
        ALTER TABLE messages ADD COLUMN error_desc TEXT;
    END IF;
END $$;

-- 4. Update Status Constraint on Messages
-- We drop the old constraint and add a new one to support all Meta states
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check 
    CHECK (status IN ('PENDING', 'QUEUED', 'SENT_PENDING_META', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BLOCKED'));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_wa_tenant ON whatsapp_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_msg_meta_id ON messages(meta_message_id);
CREATE INDEX IF NOT EXISTS idx_msg_status_pending ON messages(status) WHERE status = 'SENT_PENDING_META';
