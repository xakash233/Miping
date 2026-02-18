
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../../db');
const AppError = require('../../utils/AppError');

// Ensure Razorpay keys are set (in .env)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_12345',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret123'
});

class PaymentService {
    async createSubscriptionOrder(tenantId, planAmount = 5000) { // Default cost: 5000 INR
        const options = {
            amount: planAmount * 100, // amount in paisa
            currency: "INR",
            receipt: `sub_${tenantId}_${Date.now()}`,
            payment_capture: 1 // Auto-capture
        };

        try {
            const order = await razorpay.orders.create(options);

            // Log pending payment in DB
            await db.query(
                `INSERT INTO payments (tenant_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, 'PENDING')`,
                [tenantId, order.id, planAmount]
            );

            return order;
        } catch (error) {
            throw new AppError('Failed to create Razorpay order', 500, error.message);
        }
    }

    async verifyPayment(tenantId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'secret123';

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Success! Activate Tenant
            await db.query('BEGIN');
            try {
                // Update payment status
                await db.query(
                    `UPDATE payments SET razorpay_payment_id = $1, status = 'SUCCESS' WHERE razorpay_order_id = $2`,
                    [razorpay_payment_id, razorpay_order_id]
                );

                // Activate Tenant
                await db.query(
                    `UPDATE tenants SET is_active = TRUE WHERE id = $1`,
                    [tenantId]
                );

                // Add initial Credits as a bonus? Or separate logic?
                // Let's adhere to "Is Active" logic for now.

                await db.query('COMMIT');
                return { success: true, message: "Subscription Activated!" };
            } catch (err) {
                await db.query('ROLLBACK');
                throw err;
            }
        } else {
            throw new AppError('Payment verification failed', 400, 'INVALID_SIGNATURE');
        }
    }
}

module.exports = new PaymentService();
