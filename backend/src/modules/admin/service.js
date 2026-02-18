const adminRepository = require('./repository');
const authService = require('../auth/service');
const db = require('../../db');
const planService = require('../plans/service');
const emailService = require('../../services/email');

class AdminService {
    async getDashboardStats() {
        // ... (unchanged)
        const stats = await adminRepository.getSystemStats();
        // ...
        return {
            ...stats,
            system: {
                uptime: `${Math.floor(process.uptime() / 60)} minutes`,
                status: 'HEALTHY',
                timestamp: new Date().toISOString()
            }
        };
    }

    async createTenantAdmin(data) {
        // 1. Create Tenant & User
        const { tenant, user, token } = await authService.registerTenant(data);

        // 2. Assign Plan (if provided)
        if (data.planId) {
            await planService.assignPlan(tenant.id, data.planId, 'COMPLETED');
        }

        // 3. Send Welcome Email
        // We only send email if created by Super Admin (which this method is for)
        await emailService.sendWelcomeEmail(
            user.email,
            user.full_name,
            user.email,
            data.adminPassword // We need the raw password here. It's passed in data.
        );

        return { tenant, user };
    }

    async getAllTenants() {
        return await adminRepository.getAllTenantsWithAdmins();
    }

    async deleteTenant(tenantId) {
        return await adminRepository.deleteTenant(tenantId);
    }
}

module.exports = new AdminService();
