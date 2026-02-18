const db = require('../../db');

class ContactRepository {
    async create(tenantId, { phone, name, attributes }) {
        const query = `
      INSERT INTO contacts (tenant_id, phone_e164, name, attributes)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
        const { rows } = await db.query(query, [tenantId, phone, name, attributes]);
        return rows[0];
    }

    async findByPhone(tenantId, phone) {
        const query = `SELECT * FROM contacts WHERE tenant_id = $1 AND phone_e164 = $2`;
        const { rows } = await db.query(query, [tenantId, phone]);
        return rows[0];
    }

    async findAll(tenantId) {
        const query = `SELECT * FROM contacts WHERE tenant_id = $1`;
        const { rows } = await db.query(query, [tenantId]);
        return rows;
    }

    // Bulk create/upsert could be optimized with unnest or jsonb_to_recordset
    // For MVP, we might loop or use a single transaction.
    // Implementation below uses a loop inside a transaction for clarity/safety, 
    // though batch insert is better for performance.
}

module.exports = new ContactRepository();
