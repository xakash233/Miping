const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const db = require('../../db');
const userRepository = require('./repository');
const tenantRepository = require('../tenants/repository');
const planService = require('../plans/service');
const emailService = require('../../services/email');
const AppError = require('../../utils/AppError');

const privateKey = fs.readFileSync(path.join(process.cwd(), 'keys', 'private.pem'), 'utf8');

class AuthService {
    async registerTenant({ tenantName, slug, adminEmail, adminPassword, adminName, countryCode = 'IN' }) {
        const existingUser = await userRepository.findByEmail(adminEmail);
        if (existingUser) throw new AppError('Email already in use', 400);

        const existingTenant = await tenantRepository.findBySlug(slug);
        if (existingTenant) throw new AppError('Slug already in use', 400);

        const currency = countryCode === 'IN' ? 'INR' : 'USD';
        const timezone = countryCode === 'IN' ? 'Asia/Kolkata' : 'UTC';

        const tenant = await tenantRepository.create(tenantName, slug, countryCode, currency, timezone);
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        const user = await userRepository.create({
            tenant_id: tenant.id,
            email: adminEmail,
            password_hash: passwordHash,
            role: adminEmail === 'super@miping.com' ? 'SUPER_ADMIN' : 'ADMIN',
            full_name: adminName
        });

        const token = jwt.sign(
            { id: user.id, tenant_id: user.tenant_id, role: user.role, email: user.email },
            privateKey, { algorithm: 'RS256', expiresIn: '1d' }
        );

        return { token, user, tenant };
    }

    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new AppError('Incorrect email or password', 401, 'INVALID_CREDS');
        }

        const token = jwt.sign(
            { id: user.id, tenant_id: user.tenant_id, role: user.role, email: user.email },
            privateKey, { algorithm: 'RS256', expiresIn: '1d' }
        );

        return { token, user: { ...user, password_hash: undefined } };
    }

    // --- Self-Service Registration Flow ---

    async initRegistration(data) {
        const { email, tenantName, slug, planId } = data;

        // Check availability
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) throw new AppError('Email already in use', 400);

        const existingTenant = await tenantRepository.findBySlug(slug);
        if (existingTenant) throw new AppError('Slug already in use', 400);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Store OTP
        console.log('Storing OTP for:', email);
        await db.query(
            `INSERT INTO registration_otps (email, otp, data, expires_at) 
             VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET otp = $2, data = $3, expires_at = $4`,
            [email, otp, JSON.stringify(data), expiresAt]
        );
        console.log('OTP Stored successfully');

        // Send Email
        console.log('Sending OTP email to:', email);
        try {
            const emailSent = await emailService.sendOTPEmail(email, otp);
            if (!emailSent) {
                throw new Error('Email service returned failure status');
            }
            console.log('OTP Email sent successfully');
        } catch (emailError) {
            console.error('FAILED to send OTP email:', emailError.message);
            throw new AppError(`Email Error: ${emailError.message}. Please check your SMTP settings in .env`, 500);
        }

        return { message: 'OTP sent to your email' };
    }

    async verifyOTP(email, otp) {
        const { rows } = await db.query(
            `SELECT * FROM registration_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()`,
            [email, otp]
        );

        if (rows.length === 0) {
            throw new AppError('Invalid or expired OTP', 400);
        }

        // Return the registration data to the frontend for the payment step
        return {
            success: true,
            registrationData: rows[0].data,
            verificationToken: jwt.sign({ email, verified: true }, privateKey, { algorithm: 'RS256', expiresIn: '30m' })
        };
    }

    async completeRegistration(verificationToken, paymentData) {
        // 1. Verify verification token
        let decoded;
        try {
            const publicPem = fs.readFileSync(path.join(process.cwd(), 'keys', 'public.pem'), 'utf8');
            decoded = jwt.verify(verificationToken, publicPem, { algorithms: ['RS256'] });
        } catch (e) {
            console.error('Token verification failed:', e);
            throw new AppError('Invalid verification session', 400);
        }

        // 2. Fetch original registration data
        const { rows } = await db.query(`SELECT data FROM registration_otps WHERE email = $1`, [decoded.email]);
        if (rows.length === 0) throw new AppError('Registration data not found', 404);

        const regData = rows[0].data;

        // 3. Create Tenant & User
        const result = await this.registerTenant({
            tenantName: regData.tenantName,
            slug: regData.slug,
            adminEmail: regData.email,
            adminPassword: regData.password,
            adminName: regData.adminName
        });

        // 4. Assign Plan
        await planService.assignPlan(result.tenant.id, regData.planId, 'PAID');

        // 5. Send Final Welcome Email with ID/Password
        await emailService.sendWelcomeEmail(regData.email, regData.adminName, regData.email, regData.password);

        // 6. Cleanup OTP
        await db.query(`DELETE FROM registration_otps WHERE email = $1`, [decoded.email]);

        return result;
    }
}

module.exports = new AuthService();
