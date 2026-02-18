const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const userRepository = require('./repository');
const tenantRepository = require('../tenants/repository');
const AppError = require('../../utils/AppError');

const privateKey = fs.readFileSync(path.join(process.cwd(), 'keys', 'private.pem'), 'utf8');

class AuthService {
    async registerTenant({ tenantName, slug, adminEmail, adminPassword, adminName, countryCode = 'IN' }) {
        // 1. Check if login already exists
        const existingUser = await userRepository.findByEmail(adminEmail);
        if (existingUser) throw new AppError('Email already in use', 400, 'EMAIL_EXISTS');

        const existingTenant = await tenantRepository.findBySlug(slug);
        if (existingTenant) throw new AppError('Slug already in use', 400, 'SLUG_EXISTS');

        // Determine Defaults based on Country
        // Default to India (INR, Asia/Kolkata) if IN, otherwise generic defaults
        const currency = countryCode === 'IN' ? 'INR' : 'USD';
        const timezone = countryCode === 'IN' ? 'Asia/Kolkata' : 'UTC';

        // 2. Create Tenant
        const tenant = await tenantRepository.create(tenantName, slug, countryCode, currency, timezone);

        // 3. Hash Password
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        // 4. Create Admin User
        const user = await userRepository.create({
            tenant_id: tenant.id,
            email: adminEmail,
            password_hash: passwordHash,
            role: adminEmail === 'super@miping.com' ? 'SUPER_ADMIN' : 'ADMIN',
            full_name: adminName
        });

        // 5. Auto-login (Generate Token)
        const token = jwt.sign(
            {
                id: user.id,
                tenant_id: user.tenant_id,
                role: user.role,
                email: user.email
            },
            privateKey,
            { algorithm: 'RS256', expiresIn: '1d' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenant_id: user.tenant_id
            },
            tenant
        };
    }

    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new AppError('Incorrect email or password', 401, 'INVALID_CREDS');
        }

        const token = jwt.sign(
            {
                id: user.id,
                tenant_id: user.tenant_id,
                role: user.role,
                email: user.email
            },
            privateKey,
            { algorithm: 'RS256', expiresIn: '1d' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenant_id: user.tenant_id,
                full_name: user.full_name
            }
        };
    }
}

module.exports = new AuthService();
