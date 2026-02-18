const crypto = require('crypto');
const kafka = require('../../services/kafka');

const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'mytoken';
const WEBHOOK_TOPIC = 'meta.webhooks';

exports.handleMetaWebhook = async (req, res, next) => {
    try {
        // 1. Validation (Signature)
        // If APP_SECRET is missing, we might skip signature check in dev, but log warning.
        if (APP_SECRET) {
            const signature = req.headers['x-hub-signature-256'];
            if (!signature) {
                console.warn('Missing X-Hub-Signature-256');
                return res.sendStatus(401);
            }

            const elements = signature.split('=');
            const signatureHash = elements[1];
            const expectedHash = crypto
                .createHmac('sha256', APP_SECRET)
                .update(req.rawBody || JSON.stringify(req.body))
                .digest('hex');

            if (signatureHash !== expectedHash) {
                console.warn('Invalid Webhook Signature');
                return res.sendStatus(403);
            }
        } else {
            console.warn('FACEBOOK_APP_SECRET not set, skipping signature validation.');
        }

        // 2. Push to Kafka (Async Processing)
        const body = req.body;

        // Handling subscription verification logic is usually GET, so this is POST => Payload
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                // Partition by WABA ID to keep order per account
                const wabaId = entry.id;
                await kafka.sendToQueue(WEBHOOK_TOPIC, wabaId, entry);
            }
        } else {
            // Unknown event type, just acknowledge
        }

        res.sendStatus(200);

    } catch (err) {
        console.error('Webhook Error:', err);
        // Always return 200 to Meta to prevent retries of bad payloads
        res.sendStatus(200);
    }
};

exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook Verified!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};
