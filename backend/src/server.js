require('dotenv').config();
const app = require('./app');
const db = require('./db');
const initScheduler = require('./scheduler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Check DB connection
        await db.query('SELECT 1');
        console.log(' DB Connection successful!');

        // Start Scheduler
        initScheduler();

        app.listen(PORT, () => {
            console.log(` App running on port ${PORT}`);
        });
    } catch (err) {
        console.error(' UNHANDLED EXCEPTION! Shutting down...');
        console.error(err);
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (err) => {
    console.error(' UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    process.exit(1);
});

