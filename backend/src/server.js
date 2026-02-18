const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const db = require('./db');
const initScheduler = require('./scheduler');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Check DB connection
        await db.query('SELECT 1');
        console.log('DB Connection successful!');

        // Start Scheduler
        initScheduler();

        app.listen(PORT, () => {
            console.log(`App running on port ${PORT}...`);
        });
    } catch (err) {
        console.error('UNHANDLED EXCEPTION! 💥 Shutting down...');
        console.error(err.name, err.message);
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});
