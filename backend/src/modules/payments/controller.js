
const paymentService = require('./service');
const catchAsync = require('../../utils/catchAsync');

exports.createOrder = catchAsync(async (req, res, next) => {
    // Check if created
    const { amount } = req.body;
    const order = await paymentService.createSubscriptionOrder(req.tenant.id, amount); // Optional amount override

    res.status(200).json({
        success: true,
        order
    });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = await paymentService.verifyPayment(req.tenant.id, {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    });

    res.status(200).json({
        success: true,
        data: result
    });
});
