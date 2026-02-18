const messageRepository = require('./repository');
const contactRepository = require('../contacts/repository');
const templateRepository = require('../templates/repository');
const whatsappRepo = require('../whatsapp/repository');
const kafka = require('../../services/kafka');
const AppError = require('../../utils/AppError');
const { v4: uuidv4 } = require('uuid');

const TOPIC_SEND = 'messages.send';

class MessageService {

    /**
     * Entry point for sending/scheduling a message.
     */
    async scheduleMessage(tenantId, { templateId, contactId, scheduleTime, idempotencyKey }) {
        // 1. Validate Template
        const template = await templateRepository.findById(tenantId, templateId);
        if (!template || template.status !== 'APPROVED') {
            throw new AppError('Invalid or unapproved template', 400);
        }

        // 2. Validate Contact
        const contact = await contactRepository.findById(tenantId, contactId);
        if (!contact) {
            throw new AppError('Contact not found', 404);
        }

        // 3. Get Sender Account
        // Assuming single sender for now. If multiple, frontend should pass senderId.
        const accounts = await whatsappRepo.getAccountByTenant(tenantId);
        if (!accounts || accounts.length === 0) {
            throw new AppError('No connected WhatsApp account found', 400);
        }
        const senderAccount = accounts[0]; // Default to first active

        // 4. Create Job in DB (Persistent Record)
        const job = await messageRepository.createJob(tenantId, {
            idempotencyKey: idempotencyKey || uuidv4(),
            templateId,
            contactId,
            scheduleTimeUtc: scheduleTime ? new Date(scheduleTime) : new Date(),
            cost: 0.50 // Fixed cost for now, logic to determine cost based on template type goes here
        });

        // 5. If immediate, push to Kafka
        const isImmediate = !scheduleTime || new Date(scheduleTime) <= new Date();

        if (isImmediate) {
            await this.enqueueJob(job, senderAccount, contact, template);
        }

        return job;
    }

    /**
     * Pushes a job to Kafka for dispatch
     */
    async enqueueJob(job, senderAccount, contact, template) {
        const payload = {
            tenantId: job.tenant_id,
            jobId: job.id,
            phoneNumberId: senderAccount.phone_number_id,
            recipientPhone: contact.phone_e164,
            templateName: template.name,
            templateLanguage: 'en_US', // Should come from template
            components: template.variables ? this._mapVariables(template.variables) : [], // Logic to map vars
            cost: parseFloat(job.cost)
        };

        // Partition Key: tenantId (ensures strict ordering per tenant)
        await kafka.sendToQueue(TOPIC_SEND, job.tenant_id, payload);

        // Update status to QUEUED
        await messageRepository.updateJobStatus(job.id, 'QUEUED');
    }

    _mapVariables(vars) {
        // Transform ['name', 'date'] into component structure
        // Implementation depends on variable mapping logic
        return [];
    }

    /**
     * Called by Scheduler (e.g. Cron) to process future jobs that are now due
     */
    async processPendingJobs() {
        const jobs = await messageRepository.findPendingJobs(100);
        for (const job of jobs) {
            try {
                // We need to fetch details again as findPendingJobs returns raw job
                const contact = await contactRepository.findById(job.tenant_id, job.contact_id);
                const template = await templateRepository.findById(job.tenant_id, job.template_id);
                const accounts = await whatsappRepo.getAccountByTenant(job.tenant_id);

                if (contact && template && accounts.length > 0) {
                    await this.enqueueJob(job, accounts[0], contact, template);
                } else {
                    await messageRepository.updateJobStatus(job.id, 'FAILED', 'Missing dependencies (contact/template/account)');
                }
            } catch (err) {
                console.error(`Failed to enqueue job ${job.id}:`, err);
            }
        }
    }

    async getMessageHistory(tenantId) {
        return await messageRepository.findAllJobs(tenantId);
    }
}

module.exports = new MessageService();
