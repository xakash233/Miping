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
exports.initSignup = catchAsync(async (req, res, next) => {
    const result = await authService.initRegistration(req.body);
    res.status(200).json({ success: true, ...result });
});

exports.createOrder = catchAsync(async (req, res, next) => {
    const { verificationToken, planId } = req.body;
    const result = await authService.createSignupOrder(verificationToken, planId);
    res.status(200).json({ success: true, data: result });
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    res.status(200).json({ success: true, ...result });
});

exports.completeSignup = catchAsync(async (req, res, next) => {
    const { verificationToken, paymentData } = req.body;
    const result = await authService.completeRegistration(verificationToken, paymentData);
    res.status(201).json({ success: true, data: result });
});
