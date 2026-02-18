const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const globalErrorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Import Routes
const authRoutes = require('./modules/auth/routes');
const billingRoutes = require('./modules/billing/routes');
const contactRoutes = require('./modules/contacts/routes');
const templateRoutes = require('./modules/templates/routes');
const messageRoutes = require('./modules/messages/routes');
const webhookRoutes = require('./modules/webhook/routes');
const adminRoutes = require('./modules/admin/routes');
const paymentRoutes = require('./modules/payments/routes');
const tenantRoutes = require('./modules/tenants/routes');
const planRoutes = require('./modules/plans/routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/auth', authRoutes);
app.use('/billing', billingRoutes);
app.use('/contacts', contactRoutes);
app.use('/templates', templateRoutes);
app.use('/messages', messageRoutes);
app.use('/webhook', webhookRoutes);
app.use('/admin', adminRoutes);
app.use('/payments', paymentRoutes);
app.use('/tenants', tenantRoutes);
app.use('/plans', planRoutes);
app.use('/whatsapp', require('./modules/whatsapp/routes'));
app.use('/dashboard', require('./modules/dashboard/routes'));

// Health Check (Public)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// 404 Handler
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
