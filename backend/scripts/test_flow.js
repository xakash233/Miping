const crypto = require('crypto');

// Configuration
const BASE_URL = 'http://localhost:3000';
let TOKEN = '';
let TENANT_ID = '';
let TEMPLATE_ID = '';
let CONTACT_ID = '';

// Utils
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function request(method, endpoint, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method,
        headers,
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${JSON.stringify(data)}`);
    }

    return data;
}

async function runTest() {
    try {
        console.log('--- STARTING E2E TEST ---');

        // 1. Register Tenant
        console.log('\n1. Registering Tenant...');
        const slug = `tenant-${crypto.randomBytes(4).toString('hex')}`;
        const email = `admin-${slug}@example.com`;
        const authData = await request('POST', '/auth/register-tenant', {
            tenantName: 'Test Tenant',
            slug: slug,
            adminEmail: email,
            adminPassword: 'password123',
            adminName: 'Test Admin'
        });

        TOKEN = authData.data.token;
        TENANT_ID = authData.data.user.tenant_id;
        console.log('✅ Tenant Registered:', slug);

        // 2. Add Credits (Ideally via Super Admin, but for test we might fail here if not super admin)
        // The endpoint /billing/add-credits is restricted to SUPER_ADMIN.
        // Our user is ADMIN.
        // So we can't test this via API unless we hack the DB or have a Super Admin token.
        // For this script, we will skipping API credit add and tell user to add manually in DB, 
        // OR we just use a "backdoor" or assume checking "insufficient funds" error is part of test.
        // Let's try to send message and expect failure first?
        // Start with 0 balance.

        // 3. Create Template
        console.log('\n2. Creating Template...');
        const tplData = await request('POST', '/templates', {
            name: 'hello_world',
            content: 'Hello {{1}}',
            variables: ['name'],
            metaTemplateId: 'hello_world_meta_id',
            status: 'APPROVED'
        }, TOKEN);
        TEMPLATE_ID = tplData.data.id;
        console.log('✅ Template Created:', TEMPLATE_ID);

        // 4. Import Contacts
        console.log('\n3. Importing Contacts...');
        const contactData = await request('POST', '/contacts/import', {
            contacts: [{ phone: '+15550001111', name: 'John Doe' }]
        }, TOKEN);
        console.log('✅ Contacts Imported:', contactData.data);

        // 5. Schedule Message (Should fail or stay pending due to funds?)
        // Dispatcher checks funds. Schedule does not check funds (it creates job).
        // So this should succeed.
        // 5. Schedule Message
        console.log('\n4. fetching Contact ID...');
        const contactsList = await request('GET', '/contacts', null, TOKEN);
        const contactId = contactsList.data[0]?.id;

        if (!contactId) {
            console.log('⚠️  No contact found. Skipping scheduling.');
        } else {
            console.log('✅ Found Contact:', contactId);

            console.log('\n5. Scheduling Message...');
            const jobData = await request('POST', '/messages/schedule', {
                templateId: TEMPLATE_ID,
                contactId: contactId,
                scheduleTime: new Date().toISOString(),
                idempotencyKey: crypto.randomUUID()
            }, TOKEN);
            console.log('✅ Message Scheduled:', jobData.data.id);
        }

        console.log('\n--- TEST COMPLETE (Partial) ---');
        console.log(`Tenant ID: ${TENANT_ID}`);
        console.log(`Token: ${TOKEN}`);
        console.log('Use this token to test endpoints via Postman/Curl.');

    } catch (err) {
        console.error('❌ Test Failed:', err.message);
    }
}

runTest();
