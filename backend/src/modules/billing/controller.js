const billingService = require('./service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

exports.addCredits = catchAsync(async (req, res, next) => {
    const { tenantId, amount, description } = req.body;

    if (!amount || amount <= 0) {
        return next(new AppError('Amount must be positive', 400));
    }

    // Only SUPER_ADMIN can do this, check in routes.

    const transaction = await billingService.addCredits(tenantId, amount, description);

    res.status(200).json({
        success: true,
        data: transaction
    });
});

exports.getTransactionHistory = catchAsync(async (req, res, next) => {
    const history = await billingService.getTransactionHistory(req.tenant.id);
    res.status(200).json({
        success: true,
        data: history
    });
});
