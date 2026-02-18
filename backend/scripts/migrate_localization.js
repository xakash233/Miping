const db = require('../src/db');

const migrate = async () => {
    try {
        console.log('Starting Migration: Localization (Country, Currency, Timezone)...');

        await db.query(`
            ALTER TABLE tenants 
            ADD COLUMN IF NOT EXISTS country_code VARCHAR(5) DEFAULT 'IN',
            ADD COLUMN IF NOT EXISTS currency VARCHAR(5) DEFAULT 'INR',
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';
        `);

        console.log('Migration Successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed', err);
        process.exit(1);
    }
};

migrate();
