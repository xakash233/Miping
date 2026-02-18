const db = require('../../db');

class AdminRepository {
    async getSystemStats() {
        const statsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM tenants WHERE is_active = TRUE) as total_active_tenants,
            (SELECT COUNT(*) FROM tenants) as total_tenants,
            (SELECT COUNT(*) FROM messages) as total_messages,
            (SELECT COUNT(*) FROM message_jobs WHERE status = 'PENDING') as pending_jobs,
            (SELECT COUNT(*) FROM message_jobs WHERE status = 'FAILED') as failed_jobs,
            (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'SUCCESS') as total_revenue,
            (SELECT COUNT(*) FROM messages WHERE status = 'SENT') as meta_sent,
            (SELECT COUNT(*) FROM messages WHERE status = 'DELIVERED') as meta_delivered,
            (SELECT COUNT(*) FROM messages WHERE status = 'READ') as meta_read,
            (SELECT COUNT(*) FROM messages WHERE status = 'FAILED') as meta_failed
        `;
        const statsResult = await db.query(statsQuery);
        const stats = statsResult.rows[0];

        // Traffic trend (Last 24 hours group by hour)
        const trafficTrendQuery = `
            SELECT 
                TO_CHAR(sent_at, 'HH24') as hour,
                COUNT(*) as count
            FROM messages
            WHERE sent_at > NOW() - INTERVAL '24 hours'
            GROUP BY hour
            ORDER BY hour ASC
        `;
        const trendResult = await db.query(trafficTrendQuery);

        return {
            totalActiveTenants: parseInt(stats.total_active_tenants),
            totalTenants: parseInt(stats.total_tenants),
            totalMessages: parseInt(stats.total_messages),
            pendingJobs: parseInt(stats.pending_jobs),
            failedJobs: parseInt(stats.failed_jobs),
            totalRevenue: parseFloat(stats.total_revenue),
            metaStats: {
                sent: parseInt(stats.meta_sent),
                delivered: parseInt(stats.meta_delivered),
                read: parseInt(stats.meta_read),
                failed: parseInt(stats.meta_failed)
            },
            trafficTrend: trendResult.rows.map(r => ({
                hour: r.hour + ':00',
                count: parseInt(r.count)
            }))
        };
    }

    async getAllTenantsWithAdmins() {
        const query = `
            SELECT 
                t.id, t.name, t.slug, t.balance, t.is_active, t.created_at,
                u.full_name as admin_name, u.email as admin_email
            FROM tenants t
            LEFT JOIN users u ON t.id = u.tenant_id AND u.role = 'ADMIN'
            ORDER BY t.created_at DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async deleteTenant(tenantId) {
        const query = 'DELETE FROM tenants WHERE id = $1 RETURNING *';
        const result = await db.query(query, [tenantId]);
        return result.rows[0];
    }
}

module.exports = new AdminRepository();
