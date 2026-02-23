const axios = require('axios');
const crypto = require('../../utils/crypto');
const accountRepo = require('./repository');
const AppError = require('../../utils/AppError');

const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

/**
 * Connects a WhatsApp Business Account via Embedded Signup flow or directly with Permanent Token.
 * Validates, encrypts and stores the account details.
 */
async function connectAccount(tenantId, { shortLivedToken, permanentToken, phoneNumberId, wabaId }) {
    if (!(shortLivedToken || permanentToken)) {
        throw new AppError('Missing required fields: token', 400);
    }

    try {
        let accessToken = permanentToken || shortLivedToken;
        let expiresAt = permanentToken
            ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years by default for system user
            : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days default

        // 1. Exchange for Long-Lived Token ONLY if we don't already have a permanent token
        if (!permanentToken && FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
            try {
                const exchangeRes = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`, {
                    params: {
                        grant_type: 'fb_exchange_token',
                        client_id: FACEBOOK_APP_ID,
                        client_secret: FACEBOOK_APP_SECRET,
                        fb_exchange_token: shortLivedToken
                    }
                });
                accessToken = exchangeRes.data.access_token;
                if (exchangeRes.data.expires_in) {
                    expiresAt = new Date(Date.now() + exchangeRes.data.expires_in * 1000);
                }
            } catch (fbErr) {
                console.warn('Failed to exchange Facebook Token. Using short-lived token:', fbErr.response?.data);
            }
        }

        // Auto-Discover IDs if not provided via Facebook Login
        let autoWabaId = wabaId;
        let autoPhoneNumberId = phoneNumberId;

        if (!autoWabaId || !autoPhoneNumberId) {
            try {
                // Fetch User Businesses
                const bizRes = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/me/businesses?access_token=${accessToken}`);
                const businesses = bizRes.data.data;

                if (!businesses || businesses.length === 0) {
                    throw new Error('No Business Manager linked to this Facebook Account.');
                }

                // Iterate businesses to find WABAs
                let foundWaba = null;
                let foundPhone = null;

                for (const biz of businesses) {
                    const wabaRes = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/${biz.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`);
                    const wabas = wabaRes.data.data;

                    if (wabas && wabas.length > 0) {
                        foundWaba = wabas[0].id;
                        const phoneRes = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/${foundWaba}/phone_numbers?access_token=${accessToken}`);

                        if (phoneRes.data.data && phoneRes.data.data.length > 0) {
                            foundPhone = phoneRes.data.data[0].id; // Pick first phone
                            break;
                        }
                    }
                }

                if (!foundWaba || !foundPhone) {
                    throw new Error('Could not automatically find any WhatsApp Business Account or Phone Number associated with this login.');
                }

                autoWabaId = foundWaba;
                autoPhoneNumberId = foundPhone;

            } catch (discoveryErr) {
                console.error("Auto-discovery failed:", discoveryErr?.response?.data || discoveryErr.message);
                throw new AppError(`Failed to discover WABA: ${discoveryErr?.response?.data?.error?.message || discoveryErr.message}`, 400);
            }
        }

        // 2. Validate Token & Permissions (Optional but recommended)
        // const debugRes = await axios.get(...)

        // 3. Verify Phone Number exists and belongs to WABA (Optional strong check)
        // const phoneRes = await axios.get(...)

        // 4. Encrypt Token
        const { encryptedData, iv } = crypto.encrypt(accessToken);

        // 5. Build DTO
        const accountData = {
            tenant_id: tenantId,
            waba_id: autoWabaId,
            phone_number_id: autoPhoneNumberId,
            business_account_id: autoWabaId, // Usually same or linked
            access_token_enc: encryptedData,
            access_token_iv: iv,
            token_expires_at: expiresAt,
            is_active: true,
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
