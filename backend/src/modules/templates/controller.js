const templateService = require('./service');
const catchAsync = require('../../utils/catchAsync');

exports.createTemplate = catchAsync(async (req, res, next) => {
    const result = await templateService.createTemplate(req.tenant.id, req.body);
    res.status(201).json({ success: true, data: result });
});

exports.getTemplates = catchAsync(async (req, res, next) => {
    const result = await templateService.getTemplates(req.tenant.id);
    res.status(200).json({ success: true, data: result });
});
