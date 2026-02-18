const crypto = require('crypto');
const kafka = require('../../services/kafka');
const AppError = require('../../utils/AppError');

const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const WEBHOOK_TOPIC = 'meta.webhooks';

exports.receiveWebhook = async (req, res, next) => {
    try {
        // 1. Validation (Signature)
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) {
            console.warn('Missing X-Hub-Signature-256');
            return res.sendStatus(401);
        }

        const elements = signature.split('=');
        const signatureHash = elements[1];
        const expectedHash = crypto
            .createHmac('sha256', APP_SECRET)
            .update(req.rawBody || JSON.stringify(req.body)) // specific rawBody handling for express maybe needed
            .digest('hex');

        if (signatureHash !== expectedHash) {
            console.warn('Invalid Webhook Signature');
            return res.sendStatus(403);
        }

        // 2. Push to Kafka (Async Processing)
        // Payload structure: { object: 'whatsapp_business_account', entry: [...] }
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                // Partition by WABA ID to keep order per account
                const wabaId = entry.id;
                await kafka.sendToQueue(WEBHOOK_TOPIC, wabaId, entry);
            }
        }

        res.sendStatus(200);

    } catch (err) {
        console.error('Webhook Error:', err);
        res.sendStatus(500);
    }
};

exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook Verified!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};
