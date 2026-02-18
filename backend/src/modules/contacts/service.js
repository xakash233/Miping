const contactRepository = require('./repository');
const db = require('../../db');
const AppError = require('../../utils/AppError');

class ContactService {
    normalizePhone(phone) {
        // Basic normalization: remove non-digits. 
        // If doesn't start with +, assume it might need country code or is invalid.
        // For this MVP, let's assume input needs to include country code or we strip everything non-numeric
        // and ensure it starts with +.
        let digits = phone.replace(/\D/g, '');
        if (!digits) return null;
        return '+' + digits;
    }

    async importContacts(tenantId, contacts) {
        if (contacts.length > 5000) {
            throw new AppError('Max 5000 contacts per request', 400);
        }

        const results = {
            imported: 0,
            duplicates_skipped: 0,
            validation_failed: 0,
        };

        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            for (const contact of contacts) {
                const phoneInput = contact.phone_e164 || contact.phone;
                if (!phoneInput) {
                    results.validation_failed++;
                    continue;
                }
                const phone = this.normalizePhone(phoneInput);
                if (!phone) {
                    results.validation_failed++;
                    continue;
                }

                // Check duplicate
                // In highly concurrent system, this check might fail race condition, 
                // relying on unique constraint violation is safer.
                try {
                    const query = `
                INSERT INTO contacts (tenant_id, phone_e164, name, attributes)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (tenant_id, phone_e164) DO NOTHING
                RETURNING id;
            `;
                    const { rows } = await client.query(query, [tenantId, phone, contact.name, contact.attributes || {}]);
                    if (rows.length > 0) {
                        results.imported++;
                    } else {
                        results.duplicates_skipped++;
                    }
                } catch (err) {
                    console.error('Import error', err);
                    results.validation_failed++;
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        return results;
    }
    async getContacts(tenantId) {
        return await contactRepository.findAll(tenantId);
    }
}

module.exports = new ContactService();
