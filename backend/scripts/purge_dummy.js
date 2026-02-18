const db = require('../src/db');

async function purgeData() {
    console.log('--- PURGING DUMMY DATA ---');
    try {
        // Order matters for foreign keys
        await db.query('DELETE FROM messages');
        await db.query('DELETE FROM message_jobs');
        await db.query('DELETE FROM templates');
        await db.query('DELETE FROM suppression_list');
        await db.query('DELETE FROM contacts');
        await db.query('DELETE FROM credit_transactions');

        // Delete users EXCEPT super admin
        await db.query("DELETE FROM users WHERE email != 'super@miping.com'");

        // Delete tenants EXCEPT those linked to super admin
        // First get the tenant_id of super admin
        const { rows } = await db.query("SELECT tenant_id FROM users WHERE email = 'super@miping.com'");
        const superTenantId = rows[0]?.tenant_id;

        if (superTenantId) {
            await db.query('DELETE FROM tenants WHERE id != $1', [superTenantId]);
            // Reset balance for super tenant if needed
            await db.query('UPDATE tenants SET balance = 0 WHERE id = $1', [superTenantId]);
        } else {
            // If super admin has no tenant, delete all tenants
            await db.query('DELETE FROM tenants');
        }

        console.log('✅ All dummy data purged successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Purge failed:', err);
        process.exit(1);
    }
}

purgeData();
