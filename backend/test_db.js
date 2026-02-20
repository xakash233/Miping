const db = require('./src/db');
require('dotenv').config();

async function run() {
    const res = await db.query('SELECT * FROM whatsapp_accounts');
    console.log(res.rows);
    process.exit(0);
}
run();
