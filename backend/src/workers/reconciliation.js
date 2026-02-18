const cron = require('node-cron');
const db = require('../db');
const axios = require('axios');
const crypto = require('../utils/crypto');
const whatsappRepo = require('../modules/whatsapp/repository');
const messageRepo = require('../modules/messages/repository');
const dispatcherRepo = require('../modules/messages/dispatcher_repository');

const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';
const BATCH_SIZE = 50;

async function startReconciliation() {
    console.log('Starting Reconciliation Job (Every 15 minutes)...');

    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('Running Reconciliation...');
        await reconcilePendingMessages();
    });
}

async function reconcilePendingMessages() {
    const client = await db.getClient();
    try {
        // 1. Find Stale Messages
        // State: SENT_PENDING_META, older than 5 minutes
        const query = `
            SELECT j.*, acc.phone_number_id, acc.access_token_enc, acc.token_iv 
            FROM message_jobs j
            JOIN whatsapp_accounts acc ON j.tenant_id = acc.tenant_id
            WHERE j.status = 'SENT_PENDING_META' 
            AND j.updated_at < NOW() - INTERVAL '5 minutes'
            LIMIT $1
        `;
        const { rows: jobs } = await client.query(query, [BATCH_SIZE]);

        console.log(`Found ${jobs.length} stale jobs to reconcile.`);

        for (const job of jobs) {
            await processStaleJob(job);
        }

    } catch (err) {
        console.error('Reconciliation Cycle Failed:', err);
    } finally {
        client.release();
    }
}

async function processStaleJob(job) {
    try {
        // Decrypt Token
        const accessToken = crypto.decrypt(job.access_token_enc, job.token_iv);

        // 2. Query Meta API to check status
        // We use Client Reference ID (job.id) if supported, but Meta doesn't support querying by ref_id easily.
        // We must query messages list or trust that if we don't have a WAMID, it likely failed.
        // However, if we crashed AFTER send but BEFORE DB update, Meta has it.
        // Strategy: Query recent messages? No, too expensive.
        // Fallback Strategy: If we have NO WAMID and it's stuck in SENT_PENDING_META for > 5m, 
        // it means we never got the response ID.
        // It is safer to assume FAILED and Refund. The downside is potential duplicate send if we retry.
        // But since we charge per message, refunding a message that was actually sent is a loss for us, but better than charging for failed one.
        // Ideally, we shouldn't retry automatically to avoid spam. We mark FAILED.

        console.warn(`Reconciling Job ${job.id}: Assuming FAILED due to timeout.`);

        // 3. Mark FAILED and REFUND
        await dispatcherRepo.finalizeJob(
            job.tenant_id,
            job.id,
            null,
            'FAILED',
            parseFloat(job.cost),
            'System Reconciliation: Timeout (No Meta Response)'
        );

    } catch (err) {
        console.error(`Failed to reconcile job ${job.id}:`, err);
    }
}

if (require.main === module) {
    startReconciliation();
}

module.exports = { startReconciliation };
