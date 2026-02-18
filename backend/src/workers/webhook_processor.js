const kafka = require('../services/kafka');
const whatsappRepo = require('../modules/whatsapp/repository');
const messageRepo = require('../modules/messages/repository');
const billingService = require('../modules/billing/service'); // For refund logic if needed

const TOPIC_WEBHOOK = 'meta.webhooks';
const GROUP_ID = 'webhook-processor-group-1';

async function startWebhookProcessor() {
    console.log('Starting Webhook Processor Worker...');
    await kafka.connectConsumer(GROUP_ID, TOPIC_WEBHOOK, processEvent);
    console.log('Webhook Processor Ready and Listening 🎧');
}

async function processEvent({ key, value, partition }) {
    const wabaId = key;
    const entry = value;

    // 1. Resolve Tenant
    const account = await whatsappRepo.getAccountByWabaId(wabaId);
    if (!account) {
        console.warn(`Webhook received for unknown WABA ID: ${wabaId}`);
        return;
    }
    const tenantId = account.tenant_id;

    for (const change of entry.changes) {
        const val = change.value;
        const metadata = val.metadata;

        // Case A: Template Status Update
        if (val.message_template_status_update) {
            const update = val.message_template_status_update;
            const metaTemplateId = update.message_template_id;
            const newStatus = update.event; // 'APPROVED', 'REJECTED', 'PENDING'

            console.log(`Template Status Update: ${metaTemplateId} -> ${newStatus}`);

            // Update Template in DB
            await updateTemplateStatusByMetaId(tenantId, metaTemplateId, newStatus);
            continue;
        }

        // Case B: Message Status Update
        if (val.statuses) {
            for (const status of val.statuses) {
                const eventId = `status_${status.id}_${status.status}`; // Unique per status transition
                const isNew = await whatsappRepo.checkIdempotency(tenantId, eventId);

                if (!isNew) {
                    console.log(`Duplicate status event ignored: ${eventId}`);
                    continue;
                }

                // 3. Process Status Update
                await processStatusUpdate(tenantId, status);
            }
        }
    }
}

async function processStatusUpdate(tenantId, statusObj) {
    const metaMessageId = statusObj.id;
    const newStatus = mapMetaStatus(statusObj.status);
    const timestamp = new Date(statusObj.timestamp * 1000);

    if (!newStatus) return; // Ignore unknown statuses

    // Update Message Table
    // We update 'messages' table directly. 'message_jobs' is aggregated state.
    // If 'messages' updates to FAILED, we might need to update 'message_jobs' too.

    // Check if message exists
    const message = await messageRepo.findByMetaMessageId(metaMessageId);
    if (!message) {
        console.warn(`Status update for unknown message ID: ${metaMessageId}`);
        return;
    }

    // State Guard: Prevent backward transitions
    if (isBackwardTransition(message.status, newStatus)) {
        return;
    }

    // Save Update
    await messageRepo.updateMessageStatus(message.id, newStatus, timestamp);

    // Handle Failures & Billing Reflection
    if (newStatus === 'FAILED') {
        const error = statusObj.errors?.[0];
        const errorCode = error?.code;
        const errorDesc = error?.message; // or title

        // Logic: Refund if eligible
        if (isRefundable(errorCode)) {
            try {
                // We need cost. Get it from DB.
                if (message.cost > 0) {
                    await billingService.refundMessage(tenantId, message.cost, message.job_id);
                    console.log(`Refunded cost ${message.cost} for message ${message.id}`);
                }
            } catch (err) {
                console.error(`Refund failed for message ${message.id}:`, err);
            }
        }

        // Update Job Status to FAILED
        await messageRepo.updateJobStatus(message.job_id, 'FAILED', `${errorCode}: ${errorDesc}`);

        // Suppress invalid numbers (131042)
        if (errorCode === 131042) {
            // Add to suppression list logic (TODO)
            console.log(`Auto-suppressing invalid number for tenant ${tenantId}`);
        }
    } else {
        // If DELIVERED/READ, update job status too potentially
        await messageRepo.updateJobStatus(message.job_id, newStatus);
    }
}

async function updateTemplateStatusByMetaId(tenantId, metaTemplateId, status) {
    // Ideally use Repo, doing direct query for now to avoid circular dependencies or extensive boilerplating
    const pool = require('../db');
    try {
        await pool.query(`
            UPDATE templates 
            SET status = $2, updated_at = NOW()
            WHERE meta_template_id = $1 AND tenant_id = $3
        `, [metaTemplateId, status.toUpperCase(), tenantId]);
    } catch (err) {
        console.error('Failed to update template status', err);
    }
}

function mapMetaStatus(status) {
    switch (status) {
        case 'sent': return 'SENT';
        case 'delivered': return 'DELIVERED';
        case 'read': return 'READ';
        case 'failed': return 'FAILED';
        default: return null;
    }
}

function isBackwardTransition(current, next) {
    const order = { 'PENDING': 0, 'QUEUED': 1, 'SENT_PENDING_META': 2, 'SENT': 3, 'DELIVERED': 4, 'READ': 5, 'FAILED': 99 };
    return (order[next] || 0) <= (order[current] || 0);
}

function isRefundable(code) {
    return [131042, 131026, 131047].includes(code) || (code >= 500);
}

if (require.main === module) {
    startWebhookProcessor();
}

module.exports = { startWebhookProcessor };
