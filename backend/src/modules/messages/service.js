const messageRepository = require('./repository');
const billingService = require('../billing/service');
const contactRepository = require('../contacts/repository');
const templateRepository = require('../templates/repository');
const AppError = require('../../utils/AppError');
const { v4: uuidv4 } = require('uuid');

class MessageService {
    async scheduleMessage(tenantId, { templateId, contactId, scheduleTime, idempotencyKey }) {
        // 1. Validate Template
        const template = await templateRepository.findById(tenantId, templateId);
        if (!template || template.status !== 'APPROVED') {
            throw new AppError('Invalid or unapproved template', 400);
        }

        // 2. Validate Contact (Check suppression list TODO, for now just exist check)
        // Implicitly checked by foreign key, but good to check explicit if we had suppression logic.

        // 3. Estimate Cost (Mock logic: 0.05 per msg)
        const cost = 0.05;

        // 4. Create Job
        // Note: We don't debit yet. Debit happens at dispatch time? 
        // OR we debit at schedule time to reserve funds?
        // "Implement atomic debit logic: When dispatching message: ... INSERT credit_transactions (DEBIT, PENDING_CONFIRMATION)"
        // "Dispatcher must revalidate: ... Sufficient credits"
        // So scheduling just creates the job. Dispatcher does the heavy lifting.

        const job = await messageRepository.createJob(tenantId, {
            idempotencyKey: idempotencyKey || uuidv4(),
            templateId,
            contactId,
            scheduleTimeUtc: scheduleTime || new Date(),
            cost
        });

        return job;
    }

    // Called by Scheduler
    async dispatchJob(job) {
        console.log(`Processing job ${job.id} for tenant ${job.tenant_id}`);

        try {
            // 1. Atomic Debit
            await billingService.debitForMessage(job.tenant_id, job.cost, job.id);

            // 2. Send to Meta (Mocked)
            const metaResponse = await this._sendToMetaMock(job);

            // 3. Record Message
            await messageRepository.createMessage(job.tenant_id, {
                jobId: job.id,
                metaMessageId: metaResponse.id,
                status: 'SENT'
            });

            // 4. Update Job Status
            await messageRepository.updateJobStatus(job.id, 'SENT');

        } catch (err) {
            console.error(`Failed to dispatch job ${job.id}:`, err.message);

            // Mark job as FAILED
            await messageRepository.updateJobStatus(job.id, 'FAILED', err.message);

            // If debit happened but send failed (e.g. Meta API error), assume debit logic handled transaction.
            // But if `debitForMessage` failed, then transaction rolled back, so no refund needed.
            // If `debitForMessage` succeeded, but `_sendToMetaMock` failed, we might need refund?
            // In this flow: debit -> commit. Then send.
            // If send fails, we should refund.
            if (err.message !== 'Insufficient balance') {
                // Try to refund if it wasn't a balance issue (meaning debit likely succeeded if we got past line 1)
                // Actually, `debitForMessage` throws if balance insufficient.
                // If it succeeded, we are here.
                // So yes, REFUND.
                try {
                    await billingService.refundMessage(job.tenant_id, job.cost, job.id);
                } catch (refundErr) {
                    console.error('CRITICAL: FAILED TO REFUND', refundErr);
                }
            }
        }
    }

    async _sendToMetaMock(job) {
        // Mock Meta API call
        // In real life: axios.post(...)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.1) reject(new Error('Meta API Error')); // 10% fail rate check
                resolve({ id: `wamid.${uuidv4()}` });
            }, 100);
        });
    }

    async processPendingJobs() {
        const jobs = await messageRepository.findPendingJobs();
        for (const job of jobs) {
            // Process in parallel or series? Series safer for concurrent balance updates if for same tenant.
            // Or utilize row locking in billing service.
            await this.dispatchJob(job);
        }
    }

    async getMessageHistory(tenantId) {
        return await messageRepository.findAllJobs(tenantId);
    }
}

module.exports = new MessageService();
