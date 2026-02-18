const adminRepository = require('./repository');
const authService = require('../auth/service');
const db = require('../../db');

class AdminService {
    async getDashboardStats() {
        const stats = await adminRepository.getSystemStats();

        // Extended logic if needed, e.g., external service health checks
        const uptime = process.uptime();

        return {
            ...stats,
            system: {
                uptime: `${Math.floor(uptime / 60)} minutes`,
                status: 'HEALTHY',
                timestamp: new Date().toISOString()
            }
        };
    }

    async createTenantAdmin(data) {
        // Reuse auth service logic (this handles tenant creation + admin user creation)
        return await authService.registerTenant(data);
    }

    async getAllTenants() {
        return await adminRepository.getAllTenantsWithAdmins();
    }

    async deleteTenant(tenantId) {
        return await adminRepository.deleteTenant(tenantId);
    }
}

module.exports = new AdminService();
