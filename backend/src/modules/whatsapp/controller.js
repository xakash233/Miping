const whatsappService = require('./service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

/**
 * Handle incoming request to connect WhatsApp Business Account
 * Payload: { permanentToken, phoneNumberId, wabaId }
 */
exports.connectAccount = catchAsync(async (req, res, next) => {
    const { permanentToken, phoneNumberId, wabaId } = req.body;
    // Assuming auth middleware sets req.user/tenant
    // We need tenantId from authenticated session
    const tenantId = req.tenant?.id || req.body.tenantId;

    if (!tenantId) {
        return next(new AppError('Tenant ID is required (Auth context missing)', 401));
    }

    if (!permanentToken || !phoneNumberId || !wabaId) {
        return next(new AppError('Missing required fields: permanentToken, phoneNumberId, wabaId', 400));
    }

    const result = await whatsappService.connectAccount(tenantId, {
        permanentToken,
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
    const tenantId = req.tenant?.id || req.body.tenantId || req.query.tenantId;
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
