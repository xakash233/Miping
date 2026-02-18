const dashboardService = require('./service');
const catchAsync = require('../../utils/catchAsync');

exports.getStats = catchAsync(async (req, res, next) => {
    const data = await dashboardService.getTenantStats(req.tenant.id);
    res.status(200).json({
        success: true,
        data
    });
});
