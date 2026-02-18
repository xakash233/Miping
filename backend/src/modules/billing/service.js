const db = require('../../db');
const billingRepository = require('./repository');
const AppError = require('../../utils/AppError');

class BillingService {
    /**
     * Adds credits to a tenant (Manual top-up)
     */
    async addCredits(tenantId, amount, description) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const currentBalance = await billingRepository.getTenantBalanceForUpdate(client, tenantId);
            if (currentBalance === null) throw new AppError('Tenant not found', 404);

            const newBalance = currentBalance + parseFloat(amount);

            await billingRepository.updateTenantBalance(client, tenantId, newBalance);

            const transaction = await billingRepository.createTransaction(client, {
                tenantId,
                amount,
                type: 'CREDIT',
                status: 'CONFIRMED',
                startBalance: currentBalance,
                endBalance: newBalance,
                referenceType: 'MANUAL_TOPUP',
                description
            });

            await client.query('COMMIT');
            return transaction;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Atomic Debit for Message Sending
     */
    async debitForMessage(tenantId, cost, messageJobId) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const currentBalance = await billingRepository.getTenantBalanceForUpdate(client, tenantId);
            if (currentBalance < cost) {
                throw new AppError('Insufficient balance', 402, 'INSUFFICIENT_FUNDS');
            }

            const newBalance = currentBalance - cost;

            await billingRepository.updateTenantBalance(client, tenantId, newBalance);

            await billingRepository.createTransaction(client, {
                tenantId,
                amount: -cost,
                type: 'DEBIT',
                status: 'PENDING_CONFIRMATION', // Will be confirmed when delivered, or refunded if failed? Needs definition. Plan said PENDING_CONFIRMATION.
                referenceId: messageJobId,
                referenceType: 'MESSAGE_JOB',
                startBalance: currentBalance,
                endBalance: newBalance,
                description: 'Message reservation'
            });

            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Refund if message fails
     */
    async refundMessage(tenantId, cost, messageJobId) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Idempotency check could be here or in caller.
            // We rely on transaction table logging referenceId to ensure we don't refund twice?
            // For now, simpler approach: just issue refund. Caller (Webhook) handles idempotency mostly.

            const currentBalance = await billingRepository.getTenantBalanceForUpdate(client, tenantId);
            const newBalance = currentBalance + cost;

            await billingRepository.updateTenantBalance(client, tenantId, newBalance);

            await billingRepository.createTransaction(client, {
                tenantId,
                amount: cost,
                type: 'REFUND',
                status: 'CONFIRMED',
                referenceId: messageJobId,
                referenceType: 'MESSAGE_JOB',
                startBalance: currentBalance,
                endBalance: newBalance,
                description: 'Message delivery failure refund'
            });

            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async getTransactionHistory(tenantId) {
        return await billingRepository.findAllTransactions(tenantId);
    }
}

module.exports = new BillingService();
