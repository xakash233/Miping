const adminService = require('./service');
const catchAsync = require('../../utils/catchAsync');

exports.getDashboard = catchAsync(async (req, res, next) => {
    // Only Super Admin allowed (Middleware check)
    const stats = await adminService.getDashboardStats();

    res.status(200).json({
        success: true,
        data: stats
    });
});

exports.createTenant = catchAsync(async (req, res, next) => {
    const result = await adminService.createTenantAdmin(req.body);

    res.status(201).json({
        success: true,
        data: result
    });
});

exports.getAllTenants = catchAsync(async (req, res, next) => {
    const tenants = await adminService.getAllTenants();

    res.status(200).json({
        success: true,
        data: tenants
    });
});

exports.deleteTenant = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    await adminService.deleteTenant(id);

    res.status(200).json({
        success: true,
        message: 'Tenant deleted successfully'
    });
});
