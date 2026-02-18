const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const crypto = require('../src/utils/crypto');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addWhatsappAccount() {
    const tenantId = 'e5642993-bf6d-4ad3-84b8-4ad25f896674'; // Akash Test Tenant ID

    const token = 'EAAPwOlKVyvwBQgIGf6jwUXveGLhVxwZAFrHuIPWrsQnmo8TjCahaQZB4Uug7x2kF3urJFTZC95f2aXnxHjkpLTmB1yTBaDliOz3mZCP1GZA8VoIciWocvPZCAbKefEDcDl2NFFgJiHL1QXfqEffwXi4Mrk3ELvClgReuMazJdpG0TMCxBhqxWlfUhnjZCO2VtAS1AZDZD';
    const phoneNumberId = '920962594437309';
    const wabaId = '1432811664850073';

    try {
        console.log('Encrypting token for secure storage...');
        const { encryptedData, iv } = crypto.encrypt(token);

        console.log('Connecting to database...');
        const client = await pool.connect();

        const query = `
            INSERT INTO whatsapp_accounts (
                tenant_id, waba_id, phone_number_id, business_account_id,
                access_token_enc, token_iv, token_expires_at,
                messaging_tier, quality_rating, is_active
            ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW() + INTERVAL '60 days', 'TIER_1K', 'GREEN', true
            )
            ON CONFLICT (tenant_id, phone_number_id) DO UPDATE SET
                waba_id = EXCLUDED.waba_id,
                business_account_id = EXCLUDED.business_account_id,
                access_token_enc = EXCLUDED.access_token_enc,
                token_iv = EXCLUDED.token_iv,
                updated_at = NOW()
            RETURNING *;
        `;

        const values = [
            tenantId,
            wabaId,
            phoneNumberId,
            wabaId, // Assuming business_account_id is same as waba_id for now if not provided separately
            encryptedData,
            iv
        ];

        console.log('Executing insert...');
        const result = await client.query(query, values);

        console.log('✅ WhatsApp Account Added Successfully!');
        console.log('ID:', result.rows[0].id);
        console.log('Phone ID:', result.rows[0].phone_number_id);

        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Failed to add account:', err);
        process.exit(1);
    }
}

addWhatsappAccount();
