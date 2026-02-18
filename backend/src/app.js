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

const app = express();

// Security Middleware
app.use(helmet());

//  Production CORS Setup
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://miping.vercel.app"
    ],
    credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (Development only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Miping Backend is running "
    });
});

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

// Handle Unknown Routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;

