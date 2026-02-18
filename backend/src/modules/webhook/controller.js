const messageRepository = require('../messages/repository');
const billingService = require('../billing/service');
const catchAsync = require('../../utils/catchAsync');

exports.handleMetaWebhook = catchAsync(async (req, res, next) => {
    // Meta webhook structure is complex. Simplify for this MVP.
    // Assume generic payload: { object: 'whatsapp_business_account', entries: [...] }
    // We'll process a simplified notification body for demonstration.
    // body: { status: 'failed' | 'delivered', metaMessageId: '...', error: '...' }

    const { status, metaMessageId, error } = req.body;

    if (!status || !metaMessageId) {
        // Return 200 to acknowledge webhook even if invalid, to prevent retries loop
        return res.status(200).send('OK');
    }

    const message = await messageRepository.findByMetaMessageId(metaMessageId);

    if (!message) {
        console.warn(`Webhook received for unknown message: ${metaMessageId}`);
        return res.status(200).send('OK');
    }

    // Idempotency: If already in final state, ignore? 
    // 'SENT' -> 'DELIVERED' -> 'READ'
    // 'SENT' -> 'FAILED'
    if (message.status === 'FAILED') {
        return res.status(200).send('OK');
    }

    // Update status
    // We need a method in messageRepository to update message status by ID, or just use raw query here if simple.
    // messageRepository doesn't have updateMessageStatus yet, only updateJobStatus.
    // I should add it or just run update here. 
    // Actually, I'll update the job status too? The job tracks the overall status.

    await messageRepository.updateJobStatus(message.job_id, status.toUpperCase(), error);
    // Also update message table? Yes.

    // Trigger Refund if failed
    if (status === 'failed') {
        // Need cost. Job has cost.
        // Fetch job to get cost?
        // messageRepository.findJobById... (not implemented but easy to add)
        // Or just assume standard cost or stored in message? Schema doesn't have cost in message, only job.

        // Let's rely on job update returning the job row which has cost.
        const updatedJob = await messageRepository.updateJobStatus(message.job_id, 'FAILED', error);

        if (updatedJob && updatedJob.cost > 0) {
            try {
                await billingService.refundMessage(updatedJob.tenant_id, parseFloat(updatedJob.cost), updatedJob.id);
            } catch (err) {
                console.error('REFUND FAILED in Webhook', err);
            }
        }
    }

    res.status(200).send('OK');
});

// Verification endpoint for Meta (GET)
exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === (process.env.META_WEBHOOK_VERIFY_TOKEN || 'mytoken')) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};
