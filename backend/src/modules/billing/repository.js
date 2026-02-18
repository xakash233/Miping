const db = require('../../db');

class BillingRepository {
    async createTransaction(client, { tenantId, amount, type, status, referenceId, referenceType, startBalance, endBalance, description }) {
        const query = `
      INSERT INTO credit_transactions 
      (tenant_id, amount, type, status, reference_id, reference_type, start_balance, end_balance, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
        const params = [tenantId, amount, type, status, referenceId, referenceType, startBalance, endBalance, description];

        // If client is provided (inside transaction), use it. Otherwise use pool.
        // BUT for billing, we almost ALWAYS want a transaction client.
        const q = client || db;
        const { rows } = await q.query(query, params);
        return rows[0];
    }

    async getTenantBalanceForUpdate(client, tenantId) {
        // FOR UPDATE locks the row
        const query = `SELECT balance FROM tenants WHERE id = $1 FOR UPDATE`;
        const { rows } = await client.query(query, [tenantId]);
        return rows[0] ? parseFloat(rows[0].balance) : null;
    }

    async updateTenantBalance(client, tenantId, newBalance) {
        const query = `UPDATE tenants SET balance = $1 WHERE id = $2 RETURNING balance`;
        const { rows } = await client.query(query, [newBalance, tenantId]);
        return rows[0] ? parseFloat(rows[0].balance) : null;
    }

    async findAllTransactions(tenantId) {
        const query = `
            SELECT * FROM credit_transactions 
            WHERE tenant_id = $1 
            ORDER BY created_at DESC
        `;
        const { rows } = await db.query(query, [tenantId]);
        return rows;
    }
}

module.exports = new BillingRepository();
