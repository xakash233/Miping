const planRepository = require('./repository');
const db = require('../../db');
const AppError = require('../../utils/AppError');

class PlanService {
    async createPlan(data) {
        return await planRepository.create(data);
    }

    async getPlans() {
        return await planRepository.findAll();
    }

    async getPlanById(id) {
        const plan = await planRepository.findById(id);
        if (!plan) {
            throw new AppError('Plan not found', 404);
        }
        return plan;
    }

    async updatePlan(id, data) {
        return await planRepository.update(id, data);
    }

    async deletePlan(id) {
        return await planRepository.delete(id);
    }

    async assignPlan(tenantId, planId, paymentStatus = 'COMPLETED') {
        const plan = await this.getPlanById(planId);

        // Calculate end date based on duration
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (plan.duration_days || 30));

        // Create subscription
        const query = `
            INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, is_active, payment_status)
            VALUES ($1, $2, $3, $4, true, $5)
            RETURNING *;
        `;

        const { rows } = await db.query(query, [tenantId, planId, startDate, endDate, paymentStatus]);
        return rows[0];
    }

    async getTenantSubscription(tenantId) {
        const query = `
            SELECT s.*, p.name as plan_name, p.message_limit, p.contact_limit 
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.tenant_id = $1 AND s.is_active = true
            ORDER BY s.end_date DESC
            LIMIT 1
        `;
        const { rows } = await db.query(query, [tenantId]);
        return rows[0];
    }
}

module.exports = new PlanService();
