const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const publicKey = fs.readFileSync(path.join(process.cwd(), 'keys', 'public.pem'), 'utf8');

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You remain not logged in! Please log in to get access.', 401, 'UNAUTHORIZED'));
    }

    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

        // Attach user and tenant info to request
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };
        req.tenant = {
            id: decoded.tenant_id
        };

        next();
    } catch (err) {
        return next(new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN'));
    }
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`You do not have permission to perform this action. Your role: ${req.user.role}`, 403, 'FORBIDDEN'));
        }
        next();
    };
};
