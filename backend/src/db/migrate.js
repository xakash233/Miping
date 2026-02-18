const db = require('./index');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add missing columns to tenants if they don't exist
        await db.query(`
            ALTER TABLE tenants 
            ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'IN',
            ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        `);
        console.log('Added missing columns to tenants table.');

        // Create payments table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                amount NUMERIC(15, 4) NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
                razorpay_order_id VARCHAR(255),
                razorpay_payment_id VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('Ensured payments table exists.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
