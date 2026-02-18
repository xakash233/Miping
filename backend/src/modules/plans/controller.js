const planService = require('./service');
const catchAsync = require('../../utils/catchAsync');

exports.createPlan = catchAsync(async (req, res, next) => {
    const plan = await planService.createPlan(req.body);
    res.status(201).json({
        success: true,
        data: plan
    });
});

exports.getPlans = catchAsync(async (req, res, next) => {
    const plans = await planService.getPlans();
    res.status(200).json({
        success: true,
        results: plans.length,
        data: plans
    });
});

exports.updatePlan = catchAsync(async (req, res, next) => {
    const plan = await planService.updatePlan(req.params.id, req.body);
    res.status(200).json({
        success: true,
        data: plan
    });
});

exports.deletePlan = catchAsync(async (req, res, next) => {
    await planService.deletePlan(req.params.id);
    res.status(204).json({
        success: true,
        data: null
    });
});

// Admin assigns plan to a Tenant
exports.assignPlan = catchAsync(async (req, res, next) => {
    const { tenantId, paymentStatus } = req.body;
    const subscription = await planService.assignPlan(tenantId, req.params.planId, paymentStatus);
    res.status(200).json({
        success: true,
        data: subscription
    });
});

// Tenant gets their own subscription
exports.getMySubscription = catchAsync(async (req, res, next) => {
    const subscription = await planService.getTenantSubscription(req.tenant.id);
    res.status(200).json({
        success: true,
        data: subscription
    });
});
