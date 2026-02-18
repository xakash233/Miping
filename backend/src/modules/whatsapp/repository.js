const pool = require('../../db');

/**
 * Creates or updates a WhatsApp Business Account for a tenant.
 * Uses ON CONFLICT to act as an upsert based on phone_number_id.
 */
async function createOrUpdateAccount(data) {
    const query = `
        INSERT INTO whatsapp_accounts (
            tenant_id, waba_id, phone_number_id, business_account_id,
            access_token_enc, token_iv, token_expires_at,
            messaging_tier, quality_rating, is_active
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, true
        )
        ON CONFLICT (tenant_id, phone_number_id) DO UPDATE SET
            waba_id = EXCLUDED.waba_id,
            business_account_id = EXCLUDED.business_account_id,
            access_token_enc = EXCLUDED.access_token_enc,
            token_iv = EXCLUDED.token_iv,
            token_expires_at = EXCLUDED.token_expires_at,
            is_active = true,
            updated_at = NOW()
        RETURNING *;
    `;

    const values = [
        data.tenant_id,
        data.waba_id,
        data.phone_number_id,
        data.business_account_id,
        data.access_token_enc, // ciphertext + authTag
        data.token_iv,
        data.token_expires_at,
        data.messaging_tier || 'TIER_1K',
        data.quality_rating || 'GREEN'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

async function getAccountByTenant(tenant_id) {
    const query = `SELECT * FROM whatsapp_accounts WHERE tenant_id = $1 AND is_active = true`;
    const result = await pool.query(query, [tenant_id]);
    return result.rows;
}

async function getAccountByPhoneId(phone_number_id) {
    const query = `SELECT * FROM whatsapp_accounts WHERE phone_number_id = $1`;
    const result = await pool.query(query, [phone_number_id]);
    return result.rows[0];
}

async function getAccountByWabaId(waba_id) {
    const query = `SELECT * FROM whatsapp_accounts WHERE waba_id = $1`;
    const result = await pool.query(query, [waba_id]);
    return result.rows[0];
}

async function checkIdempotency(tenant_id, event_id) {
    const query = `
        INSERT INTO webhook_idempotency (tenant_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (tenant_id, event_id) DO NOTHING
        RETURNING *;
    `;
    const result = await pool.query(query, [tenant_id, event_id]);
    return result.rowCount > 0; // True if inserted (new), False if ignored (duplicate)
}

module.exports = {
    createOrUpdateAccount,
    getAccountByTenant,
    getAccountByPhoneId,
    getAccountByWabaId,
    checkIdempotency
};
