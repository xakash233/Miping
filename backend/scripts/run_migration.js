const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        const migrationFile = process.argv[2] || 'src/db/migrations/001_whatsapp_integration.sql';
        const migrationPath = path.isAbsolute(migrationFile) ? migrationFile : path.join(__dirname, '..', migrationFile);

        console.log(`Reading migration file: ${migrationPath}`);

        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('Migration executed successfully! 🚀');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
