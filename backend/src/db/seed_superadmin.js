const bcrypt = require('bcryptjs');
const db = require('./index.js');
require('dotenv').config();

async function seedSuperAdmin() {
    console.log('--- SEEDING SUPER ADMIN ---');
    try {
        const passwordHash = await bcrypt.hash('admin123', 12);

        // Wait for DB to be ready and available
        const existingSuper = await db.query("SELECT id FROM users WHERE email = 'super@miping.com'");

        if (existingSuper.rows.length === 0) {
            // Check if tenant exists
            const existingTenant = await db.query("SELECT id FROM tenants WHERE slug = 'miping-hq'");
            let tenantId;
            if (existingTenant.rows.length === 0) {
                const newTenant = await db.query(
                    "INSERT INTO tenants (name, slug, country_code, currency, timezone, is_active) VALUES ('Miping HQ', 'miping-hq', 'IN', 'INR', 'Asia/Kolkata', true) RETURNING id"
                );
                tenantId = newTenant.rows[0].id;
                console.log("Created Miping HQ Tenant.");
            } else {
                tenantId = existingTenant.rows[0].id;
            }

            await db.query(
                "INSERT INTO users (tenant_id, email, password_hash, role, full_name) VALUES ($1, 'super@miping.com', $2, 'SUPER_ADMIN', 'Super Admin')",
                [tenantId, passwordHash]
            );
            console.log("✅ Created super@miping.com with password 'admin123'");
        } else {
            // If exists, make sure it has SUPER_ADMIN role just in case and reset to admin123
            await db.query(
                "UPDATE users SET password_hash = $1, role = 'SUPER_ADMIN' WHERE email = 'super@miping.com'",
                [passwordHash]
            );
            console.log("✅ super@miping.com already exists. Reset password to 'admin123' and ensured role is SUPER_ADMIN.");
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Error seeding super admin:", e);
        process.exit(1);
    }
}

seedSuperAdmin();
