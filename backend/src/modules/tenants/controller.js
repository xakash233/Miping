const db = require('../../db');
const catchAsync = require('../../utils/catchAsync');

exports.getTenantDashboard = catchAsync(async (req, res, next) => {
    const tenantId = req.tenant.id;

    const statsQuery = `
      SELECT 
        (SELECT balance FROM tenants WHERE id = $1) as balance,
        (SELECT COUNT(*) FROM contacts WHERE tenant_id = $1) as total_contacts,
        (SELECT COUNT(*) FROM messages WHERE tenant_id = $1) as total_messages,
        (SELECT COUNT(*) FROM messages WHERE tenant_id = $1 AND status = 'SENT') as sent_messages,
        (SELECT COUNT(*) FROM messages WHERE tenant_id = $1 AND status = 'DELIVERED') as delivered_messages,
        (SELECT COUNT(*) FROM messages WHERE tenant_id = $1 AND status = 'READ') as read_messages,
        (SELECT COUNT(*) FROM messages WHERE tenant_id = $1 AND status = 'FAILED') as failed_messages
    `;

    const { rows } = await db.query(statsQuery, [tenantId]);
    const stats = rows[0];

    // Traffic trend (Last 24 hours group by hour) for this tenant
    const trafficTrendQuery = `
        SELECT 
            TO_CHAR(sent_at, 'HH24') as hour,
            COUNT(*) as count
        FROM messages
        WHERE tenant_id = $1 AND sent_at > NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour ASC
    `;
    const trendResult = await db.query(trafficTrendQuery, [tenantId]);

    res.status(200).json({
        success: true,
        data: {
            balance: parseFloat(stats.balance || 0),
            totalContacts: parseInt(stats.total_contacts),
            totalMessages: parseInt(stats.total_messages),
            sentMessages: parseInt(stats.sent_messages),
            deliveredMessages: parseInt(stats.delivered_messages),
            readMessages: parseInt(stats.read_messages),
            failedMessages: parseInt(stats.failed_messages),
            trafficTrend: trendResult.rows.map(r => ({
                hour: r.hour + ':00',
                count: parseInt(r.count)
            }))
        }
    });
});
