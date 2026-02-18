const whatsappService = require('./service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

/**
 * Handle incoming request to connect WhatsApp Business Account
 * Payload: { code (short-lived token), phoneNumberId, wabaId }
 */
exports.connectAccount = catchAsync(async (req, res, next) => {
    const { code, phoneNumberId, wabaId } = req.body;
    // Assuming auth middleware sets req.user/tenant
    // We need tenantId from authenticated session
    // For now, let's assume `req.user.tenantId` or passed in body for dev testing if no strict auth middleware yet implemented
    const tenantId = req.user?.tenant_id || req.body.tenantId;

    if (!tenantId) {
        return next(new AppError('Tenant ID is required (Auth context missing)', 401));
    }

    if (!code || !phoneNumberId || !wabaId) {
        return next(new AppError('Missing required fields: code, phoneNumberId, wabaId', 400));
    }

    const result = await whatsappService.connectAccount(tenantId, {
        shortLivedToken: code,
        phoneNumberId,
        wabaId
    });

    res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * Get details of connected account
 */
exports.getAccountStatus = catchAsync(async (req, res, next) => {
    const tenantId = req.user?.tenant_id || req.body.tenantId || req.query.tenantId;
    if (!tenantId) return next(new AppError('Tenant ID required', 400));

    // We don't expose full token, just metadata
    const account = await whatsappService.getAccountInternal(tenantId);

    if (!account) {
        return res.status(404).json({ success: false, message: 'No WhatsApp account connected' });
    }

    // Mask sensitive Data
    const masked = {
        id: account.id,
        wabaId: account.waba_id,
        phoneNumberId: account.phone_number_id,
        tier: account.messaging_tier,
        quality: account.quality_rating,
        expiresAt: account.token_expires_at,
        isActive: account.is_active
    };

    res.status(200).json({
        success: true,
        data: masked
    });
});
