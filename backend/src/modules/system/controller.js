const db = require('../../db');
const { redis } = require('../../services/redis');
const os = require('os');

const getSystemHealth = async (req, res) => {
    const health = {
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        osLoad: os.loadavg(),
        services: {
            database: 'DOWN',
            redis: 'DOWN'
        }
    };

    try {
        await db.query('SELECT 1');
        health.services.database = 'UP';
    } catch (error) {
        health.status = 'DEGRADED';
        health.services.database = error.message;
    }

    try {
        if (redis.status === 'ready') {
            await redis.ping();
            health.services.redis = 'UP';
        } else {
            health.status = 'DEGRADED';
            health.services.redis = 'disconnected';
        }
    } catch (error) {
        health.status = 'DEGRADED';
        health.services.redis = error.message;
    }

    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
};

module.exports = {
    getSystemHealth
};
