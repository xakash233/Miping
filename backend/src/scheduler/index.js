const cron = require('node-cron');
const messageService = require('../modules/messages/service');

const initScheduler = () => {
    console.log('Starting Scheduler...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('Running message dispatcher job...');
        try {
            await messageService.processPendingJobs();
        } catch (err) {
            console.error('Scheduler Error:', err);
        }
    });
};

module.exports = initScheduler;
