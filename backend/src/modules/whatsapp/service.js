const axios = require('axios');
const crypto = require('../../utils/crypto');
const accountRepo = require('./repository');
const AppError = require('../../utils/AppError');

const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

/**
 * Connects a WhatsApp Business Account.
 * Validates, encrypts and stores the permanent token.
 */
async function connectAccount(tenantId, { permanentToken, phoneNumberId, wabaId }) {
    if (!permanentToken || !phoneNumberId || !wabaId) {
        throw new AppError('Missing required fields: permanentToken, phoneNumberId, wabaId', 400);
    }

    try {
        // 1. Set Token and generic long expiration (System Tokens don't expire)
        let accessToken = permanentToken;
        let expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years for permanent token

        // 2. Validate Token & Permissions (Optional but recommended)
        // const debugRes = await axios.get(...)

        // 3. Verify Phone Number exists and belongs to WABA (Optional strong check)
        // const phoneRes = await axios.get(...)

        // 4. Encrypt Token
        const { encryptedData, iv } = crypto.encrypt(accessToken);

        // 5. Build DTO
        const accountData = {
            tenant_id: tenantId,
            waba_id: wabaId,
            phone_number_id: phoneNumberId,
            business_account_id: wabaId, // Usually same or linked
            access_token_enc: encryptedData,
            token_iv: iv,
            token_expires_at: expiresAt,
            messaging_tier: 'TIER_1K', // Default, will be updated by webhook/polling
            quality_rating: 'GREEN'
        };

        // 6. Store in Database
        const savedAccount = await accountRepo.createOrUpdateAccount(accountData);

        return {
            id: savedAccount.id,
            phoneNumberId: savedAccount.phone_number_id,
            tier: savedAccount.messaging_tier,
            status: 'CONNECTED'
        };

    } catch (error) {
        console.error('WhatsApp Connect Error:', error.response?.data || error.message);
        throw new AppError('Failed to connect WhatsApp account: ' + (error.response?.data?.error?.message || error.message), 500);
    }
}

/**
 * Get account details (decrypted token) for internal use
 */
async function getAccountInternal(tenantId) {
    const accounts = await accountRepo.getAccountByTenant(tenantId);
    if (!accounts || accounts.length === 0) return null;

    const account = accounts[0]; // Assuming single account for now

    // Decrypt token on the fly
    const accessToken = crypto.decrypt(account.access_token_enc, account.token_iv);

    return {
        ...account,
        accessToken // Plain text token for API calls
    };
}

module.exports = {
    connectAccount,
    getAccountInternal
};
