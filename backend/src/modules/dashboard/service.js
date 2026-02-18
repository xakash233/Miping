const db = require('../../db');

class DashboardService {
    async getTenantStats(tenantId) {
        // 1. Message Stats (Total Sent)
        const msgQuery = `SELECT count(*) as total FROM message_jobs WHERE tenant_id = $1 AND status = 'DELIVERED'`;
        const { rows: msgRows } = await db.query(msgQuery, [tenantId]);

        // 2. Pending Templates
        const tempQuery = `SELECT count(*) as total FROM templates WHERE tenant_id = $1 AND status = 'PENDING'`;
        const { rows: tempRows } = await db.query(tempQuery, [tenantId]);

        // 3. Contact Count
        const contactQuery = `SELECT count(*) as total FROM contacts WHERE tenant_id = $1`;
        const { rows: contactRows } = await db.query(contactQuery, [tenantId]);

        // 4. Current Balance
        const balanceQuery = `SELECT balance FROM tenants WHERE id = $1`;
        const { rows: balanceRows } = await db.query(balanceQuery, [tenantId]);

        // 5. Activity Logs (Latest 5 Transactions/Events)
        const activityQuery = `
            SELECT 'transaction' as type, description as title, created_at, 'Activity' as icon
            FROM credit_transactions
            WHERE tenant_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `;
        const { rows: activityRows } = await db.query(activityQuery, [tenantId]);

        return {
            stats: {
                messagesSent: parseInt(msgRows[0].total),
                pendingTemplates: parseInt(tempRows[0].total),
                activeContacts: parseInt(contactRows[0].total),
                creditBalance: balanceRows[0] ? parseFloat(balanceRows[0].balance) : 0
            },
            activity: activityRows
        };
    }
}

module.exports = new DashboardService();
