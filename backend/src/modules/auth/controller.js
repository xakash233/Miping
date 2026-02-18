const authService = require('./service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

exports.registerTenant = catchAsync(async (req, res, next) => {
    const { tenantName, slug, adminEmail, adminPassword, adminName, countryCode } = req.body;

    const result = await authService.registerTenant({
        tenantName,
        slug,
        adminEmail,
        adminPassword,
        adminName,
        countryCode
    });

    res.status(201).json({
        success: true,
        data: result
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const result = await authService.login(email, password);

    res.status(200).json({
        success: true,
        data: result
    });
});
