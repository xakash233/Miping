const templateRepository = require('./repository');
const whatsappRepo = require('../whatsapp/repository');
const crypto = require('../../utils/crypto');
const axios = require('axios');
const AppError = require('../../utils/AppError');

const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';

class TemplateService {
    async createTemplate(tenantId, data) {
        const { name, category, language, content } = data;

        // 1. Get WhatsApp Account (Need Token & WABA ID)
        const accounts = await whatsappRepo.getAccountByTenant(tenantId);
        if (!accounts || accounts.length === 0) {
            throw new AppError('No connected WhatsApp account found for this tenant.', 400);
        }

        const account = accounts[0]; // Assuming first account
        const wabaId = account.waba_id;

        let accessToken;
        try {
            accessToken = crypto.decrypt(account.access_token_enc, account.token_iv);
        } catch (e) {
            throw new AppError('Failed to decrypt access token', 500);
        }

        // 2. Prepare Meta Payload
        // Ensure name is snake_case and lowercase
        const formattedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        const payload = {
            name: formattedName,
            category: category,
            components: [],
            language: language || 'en_US'
        };

        // Automatic Example Generation for Variables
        const variableMatches = content.match(/{{(\d+)}}/g);
        let bodyComponent = {
            type: 'BODY',
            text: content
        };

        if (variableMatches) {
            // Find max index (e.g. {{3}} implies 3 variables)
            const maxIndex = variableMatches
                .map(m => parseInt(m.match(/\d+/)[0]))
                .reduce((max, curr) => Math.max(max, curr), 0);

            // Meta expects: body_text: [ ["var1", "var2"] ]
            // ONE inner array containing ALL example values.
            const exampleValues = Array.from({ length: maxIndex }, (_, i) => `value_${i + 1}`);

            bodyComponent.example = {
                body_text: [exampleValues]
            };
        }

        payload.components.push(bodyComponent);
        console.log('Sending Template Payload to Meta:', JSON.stringify(payload, null, 2));

        // 3. Call Meta API to Create Template
        let metaTemplateId;
        let status = 'PENDING';

        try {
            const response = await axios.post(
                `https://graph.facebook.com/${META_API_VERSION}/${wabaId}/message_templates`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            metaTemplateId = response.data.id;
            status = response.data.status || 'PENDING';

        } catch (error) {
            const errorMsg = error.response?.data?.error?.message || error.message;
            console.error('Meta Template Creation Failed:', JSON.stringify(error.response?.data, null, 2));
            throw new AppError(`Meta API Error: ${errorMsg}`, 400);
        }

        // 4. Save to Database
        return await templateRepository.create(tenantId, {
            ...data,
            name: formattedName, // Save sanitized name
            metaTemplateId,
            status: status.toUpperCase()
        });
    }

    async getTemplates(tenantId) {
        // 1. Get WABA ID & Token
        const accounts = await whatsappRepo.getAccountByTenant(tenantId);
        if (!accounts || accounts.length === 0) {
            // If no account, just return local DB templates (likely empty)
            return await templateRepository.findAll(tenantId);
        }

        const account = accounts[0];
        const wabaId = account.waba_id;
        let accessToken;
        try {
            accessToken = crypto.decrypt(account.access_token_enc, account.token_iv);
        } catch (e) {
            console.error('Token decryption failed during sync', e);
            return await templateRepository.findAll(tenantId);
        }

        // 2. Fetch Live Templates from Meta
        try {
            const response = await axios.get(
                `https://graph.facebook.com/${META_API_VERSION}/${wabaId}/message_templates`,
                {
                    params: { limit: 100 }, // Pagination TODO
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            const metaTemplates = response.data.data; // Array of templates from Meta

            // 3. Sync Logic
            // We need to update existing ones, insert new ones (maybe), and delete missing ones.
            // For MVP: We will Iterate DB templates and update status/delete if missing.

            const dbTemplates = await templateRepository.findAll(tenantId);
            const metaMap = new Map(metaTemplates.map(t => [t.id, t])); // Map by meta_id

            // A. Update Existing & Mark Deleted
            for (const dbT of dbTemplates) {
                if (dbT.meta_template_id) {
                    const metaT = metaMap.get(dbT.meta_template_id);

                    if (!metaT) {
                        // Deleted in Meta -> Delete in DB
                        console.log(`Sync: Deleting template ${dbT.name} (missing in Meta)`);
                        // We need a delete method in Repo. For now, we might skipping or adding it.
                        // Assuming direct query or repo method.
                        await templateRepository.delete(tenantId, dbT.id);
                    } else {
                        // Exists -> Check Status
                        if (metaT.status !== dbT.status) {
                            console.log(`Sync: Updating status ${dbT.name}: ${dbT.status} -> ${metaT.status}`);
                            await templateRepository.updateStatus(tenantId, dbT.id, metaT.status);
                        }
                    }
                }
            }

            // B. (Optional) Insert new ones from Meta? 
            // Often tricky because we need local 'content' parsing. Skipping for now.

        } catch (error) {
            console.error('Template Sync Failed:', error.message);
            // Fallback to local
        }

        return await templateRepository.findAll(tenantId);
    }
}

module.exports = new TemplateService();
