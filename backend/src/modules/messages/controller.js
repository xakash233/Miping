const messageService = require('./service');
const catchAsync = require('../../utils/catchAsync');

exports.scheduleMessage = catchAsync(async (req, res, next) => {
    const { templateId, contactId, scheduleTime, idempotencyKey } = req.body;

    const job = await messageService.scheduleMessage(req.tenant.id, {
        templateId,
        contactId,
        scheduleTime,
        idempotencyKey
    });

    res.status(201).json({
        success: true,
        data: job
    });
});

exports.getMessageHistory = catchAsync(async (req, res, next) => {
    const result = await messageService.getMessageHistory(req.tenant.id);
    res.status(200).json({
        success: true,
        data: result
    });
});

