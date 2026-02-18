const kafka = require('../services/kafka');
const accountRepo = require('../modules/whatsapp/repository');
const crypto = require('../utils/crypto');
const redis = require('../services/redis');
const dispatcherRepo = require('../modules/messages/dispatcher_repository');
const axios = require('axios');

const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';
const TOPIC_SEND = 'messages.send';
const GROUP_ID = 'dispatcher-group-1';

async function startDispatcher() {
    console.log('Starting Message Dispatcher Worker...');

    // Connect dependencies
    await kafka.connectConsumer(GROUP_ID, TOPIC_SEND, processMessage);

    console.log('Dispatcher Ready and Listening 🎧');
}

async function processMessage({ key, value, partition }) {
    const { tenantId, jobId, phoneNumberId, recipientPhone, templateName, templateLanguage, components, cost = 0.50 } = value;
    // value should contain necessary job data. Assuming 'value' is JSON object.

    const logPrefix = `[Job ${jobId}]`;

    try {
        console.log(`${logPrefix} Processing dispatch for Tenant ${tenantId}`);

        // 1. Get WhatsApp Account & Token
        const account = await accountRepo.getAccountByPhoneId(phoneNumberId);
        if (!account || !account.is_active) {
            console.error(`${logPrefix} Account not active or found`);
            await dispatcherRepo.markJobFailed(jobId, 'ACCOUNT_INACTIVE');
            return;
        }

        // Decrypt Token
        let accessToken;
        try {
            accessToken = crypto.decrypt(account.access_token_enc, account.token_iv);
        } catch (e) {
            console.error(`${logPrefix} Token Decrypt Error`);
            await dispatcherRepo.markJobFailed(jobId, 'TOKEN_ERROR');
            return;
        }

        // 2. Initial Rate Limit Check (Redis)
        const tierLimit = getTierLimit(account.messaging_tier);
        const isAllowed = await redis.checkRateLimit(tenantId, phoneNumberId, tierLimit);

        if (!isAllowed) {
            // Re-queue or fail? Design says "Block overflow beyond tier".
            console.warn(`${logPrefix} Rate Limit Exceeded`);
            // We could re-queue with delay, but strictly speaking block means fail/skip for now.
            // Or use a separate 'delay' queue. 
            // For simplicity in this implementation: BLOCK = FAIL/SKIP
            await dispatcherRepo.markJobFailed(jobId, 'RATE_LIMIT_EXCEEDED');
            return;
        }

        // 3. Atomic Debit & State Update
        // This marks message_jobs as 'SENT_PENDING_META'
        // If fails (insufficient credits), returns false.
        const debitResult = await dispatcherRepo.debitAndMarkPending(tenantId, jobId, cost);
        if (!debitResult.success) {
            console.warn(`${logPrefix} Debit Failed: ${debitResult.reason}`);
            await dispatcherRepo.markJobFailed(jobId, debitResult.reason);
            return;
        }

        // 4. Call Meta API
        try {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: recipientPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: templateLanguage || 'en_US' },
                    components: components || []
                }
            };

            const response = await axios.post(
                `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const metaMessageId = response.data.messages[0].id;
            console.log(`${logPrefix} Sent via Meta! ID: ${metaMessageId}`);

            // 5. Finalize Success
            await dispatcherRepo.finalizeJob(tenantId, jobId, metaMessageId, 'SENT', cost);

        } catch (apiError) {
            // Meta API Failed
            const status = apiError.response?.status;
            const errorData = apiError.response?.data?.error;
            const errorMsg = errorData ? `${errorData.code}: ${errorData.message}` : apiError.message;

            console.error(`${logPrefix} Meta API Error: ${errorMsg}`);

            // 6. Refund & Fail
            // Only strictly if error is likely permanent or we decide to refund.
            // For network timeouts (e.g. no response), we might mistakenly refund a sent message.
            // Ideally use Reconciliation.
            // For 4xx errors, we should definitely refund/fail.
            // For 5xx, we might retry via Kafka (throw error here to trigger Kafka retry), BUT our debit logic is already committed.
            // If we retry via Kafka, we must check if we already debited?
            // "Idempotent dispatch" -> check if job status is SENT_PENDING_META.

            // Current approach: Fail immediately on API error and refund.
            await dispatcherRepo.finalizeJob(tenantId, jobId, null, 'FAILED', cost, errorMsg);
        }

    } catch (criticalError) {
        console.error(`${logPrefix} Critical Worker Error:`, criticalError);
        // Do not acknowledge Kafka message? Or move to DLQ.
        // If we assumed debit hasn't happened yet, it's fine.
        // If debit happened, we rely on Reconciliation job to clean up stuck 'SENT_PENDING_META' jobs.
    }
}

function getTierLimit(tier) {
    switch (tier) {
        case 'TIER_1K': return 1000;
        case 'TIER_10K': return 10000;
        case 'TIER_100K': return 100000;
        default: return 250; // Trial
    }
}

// Start if running standalone
if (require.main === module) {
    startDispatcher();
}

module.exports = { startDispatcher };
