-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    message_limit INTEGER NOT NULL DEFAULT 1000, -- Monthly message limit
    contact_limit INTEGER NOT NULL DEFAULT 500,  -- Total contacts limit
    duration_days INTEGER NOT NULL DEFAULT 30,   -- Validity period in days
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    payment_reference VARCHAR(255),               -- External payment ID (e.g. Paytm Order ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active);

-- Seed some default plans if they do not exist
INSERT INTO plans (name, description, price, message_limit, contact_limit, duration_days) 
SELECT 'Starter', 'For small businesses', 499.00, 1000, 500, 30
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Starter');

INSERT INTO plans (name, description, price, message_limit, contact_limit, duration_days) 
SELECT 'Professional', 'For growing teams', 1499.00, 10000, 2500, 30
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Professional');

INSERT INTO plans (name, description, price, message_limit, contact_limit, duration_days) 
SELECT 'Enterprise', 'Unlimited scale for large organizations', 4999.00, 100000, 10000, 30
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Enterprise');
