const db = require('../src/db');

const migrate = async () => {
    try {
        console.log('Starting Migration: Payments & Subscription...');

        // 1. Add is_active to tenants
        await db.query(`
            ALTER TABLE tenants 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
        `);

        // 2. Create Payments Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tenant_id UUID REFERENCES tenants(id),
                razorpay_order_id VARCHAR(255),
                razorpay_payment_id VARCHAR(255),
                amount NUMERIC(10, 2),
                currency VARCHAR(10) DEFAULT 'INR',
                status VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 3. Mark Super Admin as Active (logic: if they have SUPER_ADMIN role user)
        // For simplicity, let's update all currently existing tenants to TRUE so we don't break current setups
        await db.query(`UPDATE tenants SET is_active = TRUE`);

        console.log('Migration Successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed', err);
        process.exit(1);
    }
};

migrate();
