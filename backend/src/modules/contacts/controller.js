const contactService = require('./service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

exports.importContacts = catchAsync(async (req, res, next) => {
    const { contacts } = req.body; // Expecting array of { phone, name, attributes }

    if (!Array.isArray(contacts)) {
        return next(new AppError('Contacts must be an array', 400));
    }

    const result = await contactService.importContacts(req.tenant.id, contacts);

    res.status(200).json({
        success: true,
        data: result
    });
});

exports.getContacts = catchAsync(async (req, res, next) => {
    const result = await contactService.getContacts(req.tenant.id);
    res.status(200).json({ success: true, data: result });
});
